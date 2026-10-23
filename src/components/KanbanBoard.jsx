import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { EmptyState, ErrorMessage, LoadingState } from './shared';

const columns = ['Applied', 'Interview', 'Offer', 'Rejected'];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function JobCard({ application, onSelect, onStatusChange, onRequestDelete, pending, error, onPointerDown, suppressClick }) {
  return (
    <article
      className="job-card"
      onPointerDown={(event) => onPointerDown(event, application)}
      onClickCapture={(event) => { if (suppressClick()) { event.preventDefault(); event.stopPropagation(); } }}
      aria-label={`${application.companyName}, ${application.jobTitle}. Drag to change status.`}
    >
      <button className="job-card-open" type="button" onClick={() => onSelect(application)} aria-label={`View details for ${application.jobTitle} at ${application.companyName}`}>
        <p className="job-company">{application.companyName}</p>
        <h3>{application.jobTitle}</h3>
        {application.salary && <p className="job-salary">{application.salary}</p>}
        <div className="job-metadata">
          {application.location && <span className="job-metadata-item"><Icon name="mapPin" size={12}/><span>{application.location}</span></span>}
          <time className="job-metadata-item job-date" dateTime={application.applicationDate}>
            <Icon name="calendar" size={12}/>
            <span>{formatDate(application.applicationDate)}</span>
          </time>
        </div>
      </button>
      <div className="job-card-actions">
        <label className="job-status-control">
          <span className="visually-hidden">Change status for {application.jobTitle} at {application.companyName}</span>
          <select
            className={`job-status-select status-${application.status.toLowerCase()}`}
            value={application.status}
            disabled={pending}
            onChange={(event) => onStatusChange(application, event.target.value)}
            aria-label={`Change status for ${application.jobTitle} at ${application.companyName}`}
            aria-busy={pending}
          >
            {columns.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {pending && <span className="status-saving">Saving…</span>}
        </label>
        <button className="job-delete-button" type="button" disabled={pending} onClick={() => onRequestDelete(application)} aria-label={`Delete ${application.jobTitle} at ${application.companyName}`}>
          Delete
        </button>
      </div>
      {error && <p className="form-error status-update-error" role="alert">{error}</p>}
    </article>
  );
}

function KanbanBoard({ applications, loading, error, onRetry, noResults, onClearFilters, onSelectApplication, onAddApplication, onFilterStatus, onStatusChange, onDeleteApplication, pendingStatusIds, statusErrors }) {
  const [openMenu, setOpenMenu] = useState('');
  const [dropTarget, setDropTarget] = useState('');
  const movedCardClick = useRef(false);
  const dragRef = useRef(null);
  const latestDragHandlers = useRef(null);
  latestDragHandlers.current = { applications, onStatusChange, pendingStatusIds };

  const handlePointerDown = (event, application) => {
    if (pendingStatusIds.has(application._id) || event.button !== 0 || event.target.closest('select, input, textarea, a, button:not(.job-card-open)')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: application._id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      element: event.currentTarget,
      overlay: null,
      originalVisibility: event.currentTarget.style.visibility,
      active: false,
      dropStatus: '',
    };
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <= 4) return;
      event.preventDefault();
      if (!drag.active) {
        drag.active = true;
        const overlay = drag.element.cloneNode(true);
        const cardStyle = window.getComputedStyle(drag.element);
        Object.assign(overlay.style, {
          position: 'fixed',
          left: `${drag.left}px`,
          top: `${drag.top}px`,
          width: `${drag.width}px`,
          height: `${drag.height}px`,
          margin: '0',
          zIndex: '10000',
          pointerEvents: 'none',
          transition: 'none',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          opacity: '1',
          filter: 'none',
          background: cardStyle.backgroundColor,
          borderTopColor: cardStyle.borderTopColor,
          borderRightColor: cardStyle.borderRightColor,
          borderBottomColor: cardStyle.borderBottomColor,
          borderLeftColor: cardStyle.borderLeftColor,
          boxShadow: '0 10px 28px rgba(35, 28, 68, .22)',
        });
        overlay.classList.add('job-card-moving');
        document.body.appendChild(overlay);
        drag.overlay = overlay;
        drag.element.style.visibility = 'hidden';
      }
      drag.overlay.style.transform = `translate3d(${event.clientX - drag.startX}px, ${event.clientY - drag.startY}px, 0)`;
      const column = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-kanban-status]');
      drag.dropStatus = column?.dataset.kanbanStatus || '';
      setDropTarget((current) => current === drag.dropStatus ? current : drag.dropStatus);
    };
    const finishDrag = (event, shouldDrop) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (drag.active) {
        const column = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-kanban-status]');
        const status = column?.dataset.kanbanStatus || drag.dropStatus;
        drag.overlay?.remove();
        drag.element.style.visibility = drag.originalVisibility;
        movedCardClick.current = true;
        const { applications: currentApplications, onStatusChange: changeStatus, pendingStatusIds: currentPendingIds } = latestDragHandlers.current;
        const application = currentApplications.find((item) => item._id === drag.id);
        if (shouldDrop && application && status && application.status !== status && !currentPendingIds.has(application._id)) changeStatus(application, status);
        window.setTimeout(() => { movedCardClick.current = false; }, 250);
      }
      setDropTarget('');
    };
    const handlePointerUp = (event) => finishDrag(event, true);
    const handlePointerCancel = (event) => finishDrag(event, false);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, []);

  if (loading) return <LoadingState message="Loading applications…" />;
  if (noResults) {
    return <EmptyState title="No matching applications" message="Try another search or clear your filters to see all applications." action={onClearFilters ? <button className="no-results-clear" onClick={onClearFilters}>Clear filters</button> : null} />;
  }

  return (
    <section className="board-section" aria-label="Applications by status">
      {error && <ErrorMessage message={error} onRetry={onRetry} />}
      <div className="kanban-scroll max-[760px]:h-[calc(100vh-220px)] max-[760px]:min-h-[360px]">
        <div className="kanban-board max-[1100px]:grid-cols-[repeat(4,270px)] max-[1100px]:w-max max-[1100px]:min-w-0 max-[760px]:grid-cols-[repeat(4,260px)]">
          {columns.map((status) => {
            const statusApplications = applications.filter((application) => application.status === status);
            const statusClass = status.toLowerCase();

            return (
              <section
                className={`kanban-column kanban-column-${statusClass} ${dropTarget === status ? 'kanban-column-drop-target' : ''}`}
                data-kanban-status={status}
                key={status}
                aria-label={`${status} applications`}
              >
                <header className="kanban-column-header">
                  <span className="column-heading"><Icon name={statusClass === 'interview' ? 'interviews' : statusClass} size={14} className="column-status-icon"/><h2>{status === 'Interview' ? 'Interviewing' : status}</h2></span>
                  <div className="column-heading-actions"><span className="kanban-count">{error ? '—' : statusApplications.length}</span><button type="button" className="column-settings" aria-label={`${status} column options`} aria-expanded={openMenu === status} title={`${status} column options`} onClick={() => setOpenMenu((current) => current === status ? '' : status)}>⋯</button>{openMenu === status && <div className="column-menu"><button onClick={() => { onAddApplication(status); setOpenMenu(''); }}>Add job here</button><button onClick={() => { onFilterStatus(status); setOpenMenu(''); }}>Filter this status</button></div>}</div>
                </header>
                <div className="kanban-cards">
                  {error ? (
                    <EmptyState title="Unavailable" message="Could not load applications." />
                  ) : statusApplications.length > 0 ? (
                    statusApplications.map((application) => (
                      <JobCard
                        application={application}
                        onSelect={onSelectApplication}
                        onStatusChange={onStatusChange}
                        onRequestDelete={onDeleteApplication}
                        pending={pendingStatusIds.has(application._id)}
                        error={statusErrors[application._id]}
                        onPointerDown={handlePointerDown}
                        suppressClick={() => movedCardClick.current}
                        key={application._id}
                      />
                    ))
                  ) : (
                    <EmptyState title="No applications" message={`Applications in ${status} will appear here.`} />
                  )}
                </div>
                <button className="column-add-job" type="button" onClick={() => onAddApplication(status)}>
                  <span aria-hidden="true">+</span> Add job
                </button>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default KanbanBoard;

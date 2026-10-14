import { useState } from 'react';
import Icon from './Icon';
import { EmptyState, ErrorMessage, LoadingState } from './UI';

const columns = ['Applied', 'Interview', 'Offer', 'Rejected'];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function JobCard({ application, onSelect, onStatusChange, onRequestDelete, pending, error, onDragStart, onDragEnd, dragging }) {
  return (
    <article
      className={`job-card ${dragging ? 'job-card-dragging' : ''}`}
      draggable={!pending}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', application._id);
        onDragStart(application._id);
      }}
      onDragEnd={onDragEnd}
      aria-label={`${application.companyName}, ${application.jobTitle}. Drag to change status.`}
    >
      <div className="job-card-open">
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
      </div>
      <div className="job-card-actions">
        <button className="job-edit-button" type="button" disabled={pending} onClick={() => onSelect(application)} aria-label={`Edit ${application.jobTitle} at ${application.companyName}`}>Edit</button>
        <label className="job-status-control">
          <span className="visually-hidden">Change status for {application.jobTitle} at {application.companyName}</span>
          <select
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
  const [draggedId, setDraggedId] = useState('');
  const [dropTarget, setDropTarget] = useState('');

  const handleDrop = (event, status) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || draggedId;
    const application = applications.find((item) => item._id === id);
    if (application && application.status !== status && !pendingStatusIds.has(id)) {
      onStatusChange(application, status);
    }
    setDraggedId('');
    setDropTarget('');
  };

  if (loading) return <LoadingState message="Loading applications…" />;
  if (noResults) {
    return <EmptyState title="No matching applications" message="Try another search or clear your filters to see all applications." action={onClearFilters ? <button className="no-results-clear" onClick={onClearFilters}>Clear filters</button> : null} />;
  }

  return (
    <section className="board-section" aria-label="Applications by status">
      {error && <ErrorMessage message={error} onRetry={onRetry} />}
      <div className="kanban-scroll">
        <div className="kanban-board">
          {columns.map((status) => {
            const statusApplications = applications.filter((application) => application.status === status);
            const statusClass = status.toLowerCase();

            return (
              <section
                className={`kanban-column kanban-column-${statusClass} ${dropTarget === status ? 'kanban-column-drop-target' : ''}`}
                key={status}
                aria-label={`${status} applications`}
                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTarget(status); }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(''); }}
                onDrop={(event) => handleDrop(event, status)}
              >
                <header className="kanban-column-header">
                  <span className="column-heading"><span className={`status-dot status-dot-${statusClass}`} aria-hidden="true"/><h2>{status === 'Interview' ? 'Interviewing' : status}</h2></span>
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
                        dragging={draggedId === application._id}
                        onDragStart={setDraggedId}
                        onDragEnd={() => { setDraggedId(''); setDropTarget(''); }}
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

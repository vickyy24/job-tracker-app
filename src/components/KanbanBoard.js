import { useState } from 'react';
import { Button, EmptyState, ErrorMessage, LoadingState, StatusBadge } from './UI';

const columns = ['Applied', 'Interview', 'Offer', 'Rejected'];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function JobCard({ application, onSelect, onStatusChange, onRequestDelete, pending, error }) {
  return (
    <article className="job-card">
      <button className="job-card-open" type="button" onClick={() => onSelect(application)} aria-label={`View and edit ${application.jobTitle} at ${application.companyName}`}>
        <div className="job-card-heading">
          <p className="job-company">{application.companyName}</p>
          <StatusBadge status={application.status} />
        </div>
        <h3>{application.jobTitle}</h3>
        <time className="job-date" dateTime={application.applicationDate}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="3.5" y="5" width="13" height="11.5" rx="2" />
            <path d="M6.5 3.5v3M13.5 3.5v3M3.5 8.5h13" />
          </svg>
          <span>{formatDate(application.applicationDate)}</span>
        </time>
      </button>
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
      {error && <p className="status-update-error" role="alert">{error}</p>}
      <button className="job-delete-button" type="button" onClick={() => onRequestDelete(application)} aria-label={`Delete ${application.jobTitle} at ${application.companyName}`}>
        Delete
      </button>
    </article>
  );
}

function KanbanBoard({ applications, loading, error, onRetry, noResults, onClearFilters, onSelectApplication, onStatusChange, onDeleteApplication, pendingStatusIds, statusErrors }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    setDeletingId(deleteTarget._id);
    setDeleteError('');
    try {
      await onDeleteApplication(deleteTarget);
      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(requestError.message || 'The application could not be deleted.');
    } finally {
      setDeletingId('');
    }
  };

  if (loading) return <LoadingState message="Loading applications…" />;
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />;
  if (noResults) {
    return <EmptyState title="No matching applications" message="Try another search or clear your filters to see all applications." action={onClearFilters ? <button className="no-results-clear" onClick={onClearFilters}>Clear filters</button> : null} />;
  }

  return (
    <section className="board-section" aria-label="Applications by status">
      <div className="kanban-scroll">
        <div className="kanban-board">
          {columns.map((status) => {
            const statusApplications = applications.filter((application) => application.status === status);
            const statusClass = status.toLowerCase();

            return (
              <section className={`kanban-column kanban-column-${statusClass}`} key={status} aria-label={`${status} applications`}>
                <header className="kanban-column-header">
                  <h2>{status}</h2>
                  <span className="kanban-count">{statusApplications.length}</span>
                </header>
                <div className="kanban-cards">
                  {statusApplications.length > 0 ? (
                    statusApplications.map((application) => (
                      <JobCard
                        application={application}
                        onSelect={onSelectApplication}
                        onStatusChange={onStatusChange}
                        onRequestDelete={(application) => {
                          setDeleteError('');
                          setDeleteTarget(application);
                        }}
                        pending={pendingStatusIds.has(application._id)}
                        error={statusErrors[application._id]}
                        key={application._id}
                      />
                    ))
                  ) : (
                    <EmptyState title="No applications" message={`Applications in ${status} will appear here.`} />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {deleteTarget && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setDeleteTarget(null); }}>
          <section
            className="delete-confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
            aria-describedby="delete-confirmation-message"
            onKeyDown={(event) => { if (event.key === 'Escape' && !deletingId) setDeleteTarget(null); }}
          >
            <p className="eyebrow">DELETE APPLICATION</p>
            <h2 id="delete-confirmation-title">Delete {deleteTarget.companyName}?</h2>
            <p id="delete-confirmation-message">This will permanently delete the application for {deleteTarget.jobTitle}. This action cannot be undone.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="form-actions">
              <Button variant="secondary" autoFocus disabled={Boolean(deletingId)} onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button className="confirm-delete-button" disabled={Boolean(deletingId)} onClick={confirmDelete}>
                {deletingId ? 'Deleting…' : 'Delete application'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default KanbanBoard;

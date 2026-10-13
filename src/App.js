import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ErrorMessage, LoadingState } from './components/UI';
import KanbanBoard from './components/KanbanBoard';
import ApplicationForm from './components/ApplicationForm';
import { createApplication, deleteApplication as deleteApplicationRequest, getApplicationStats, listApplications, updateApplication } from './services/applicationApi';
import './App.css';

const statCards = [
  { label: 'Total Applications', key: 'totalApplications', tone: 'purple' },
  { label: 'Interviews', key: 'interviews', tone: 'blue' },
  { label: 'Offers', key: 'offers', tone: 'green' },
  { label: 'Rejections', key: 'rejections', tone: 'rose' },
];

const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

function App() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('applicationDate');
  const [order, setOrder] = useState('desc');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [editingApplication, setEditingApplication] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [pendingStatusIds, setPendingStatusIds] = useState(() => new Set());
  const [statusErrors, setStatusErrors] = useState({});
  const requestNumber = useRef(0);

  const refreshStats = useCallback(() => {
    setLoadingStats(true);
    setStatsError('');

    return getApplicationStats()
      .then(setStats)
      .catch((error) => setStatsError(error.message))
      .finally(() => setLoadingStats(false));
  }, []);

  const refreshApplications = useCallback((filters = {}) => {
    const requestId = requestNumber.current + 1;
    requestNumber.current = requestId;
    setLoadingApplications(true);
    setApplicationsError('');

    return listApplications(filters)
      .then((result) => {
        if (requestId === requestNumber.current) setApplications(result.data);
      })
      .catch((error) => {
        if (requestId === requestNumber.current) setApplicationsError(error.message);
      })
      .finally(() => {
        if (requestId === requestNumber.current) setLoadingApplications(false);
      });
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshApplications({ search: search.trim(), status, sortBy, order });
    }, 300);
    return () => clearTimeout(timer);
  }, [refreshApplications, search, status, sortBy, order]);

  const clearFilters = () => {
    requestNumber.current += 1;
    setSearch('');
    setStatus('');
  };

  const saveApplication = async (application) => {
    setSavingApplication(true);
    setCreateError('');
    try {
      await createApplication(application);
      setShowApplicationForm(false);
      setCreateSuccess('Application added.');
      refreshApplications({ search: search.trim(), status, sortBy, order });
      refreshStats();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setSavingApplication(false);
    }
  };

  const saveEdit = async (updates) => {
    setSavingEdit(true);
    setEditError('');
    try {
      await updateApplication(editingApplication._id, updates);
      setEditingApplication(null);
      setCreateSuccess('Application updated.');
      refreshApplications({ search: search.trim(), status, sortBy, order });
      refreshStats();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const changeApplicationStatus = async (application, nextStatus) => {
    const id = application._id;
    setPendingStatusIds((current) => new Set(current).add(id));
    setStatusErrors((current) => ({ ...current, [id]: '' }));
    try {
      await updateApplication(id, { status: nextStatus });
      setApplications((current) => current
        .map((item) => item._id === id ? { ...item, status: nextStatus } : item)
        .filter((item) => !status || item.status === status));
      setCreateSuccess('Application status updated.');
      refreshStats();
    } catch (error) {
      setStatusErrors((current) => ({ ...current, [id]: error.message }));
    } finally {
      setPendingStatusIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const removeApplication = async (application) => {
    await deleteApplicationRequest(application._id);
    setApplications((current) => current.filter((item) => item._id !== application._id));
    setCreateSuccess('Application deleted.');
    refreshStats();
  };

  const hasFilters = Boolean(search.trim() || status);

  return (
    <div className="app-shell" id="dashboard">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="Job Tracker home">
          <span className="brand-mark" aria-hidden="true">J</span>
          <span>job<span className="brand-accent">track</span></span>
        </a>

        <nav className="primary-nav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#dashboard" aria-current="page">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <rect x="12" y="12" width="5" height="5" rx="1" />
            </svg>
            <span>Dashboard</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="footer-dot" aria-hidden="true" />
          <span>Your job search, in one place</span>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="topbar-label">Workspace</span>
            <span className="topbar-title">Job Tracker</span>
          </div>
          <Button className="add-job-button" onClick={() => {
            setCreateError('');
            setCreateSuccess('');
            setShowApplicationForm(true);
          }}>
            <span className="plus-icon" aria-hidden="true">+</span>
            <span>Add Job</span>
          </Button>
        </header>

        <main className="dashboard-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR OVERVIEW</p>
              <h1 tabIndex="-1" data-dialog-focus-fallback>Dashboard</h1>
              <p className="page-description">A calmer way to keep your job search moving.</p>
            </div>
            <div className="today-chip">
              <span className="today-dot" aria-hidden="true" />
              Personal workspace
            </div>
          </div>

          <section className="stats-section" aria-label="Application statistics" aria-busy={loadingStats}>
            {loadingStats && <LoadingState message="Loading your application stats…" />}
            {statsError && <ErrorMessage message={statsError} onRetry={refreshStats} />}
            <div className="stats-grid">
              {statCards.map((card) => (
                <article className="stat-card" key={card.key}>
                  <div className="stat-card-heading">
                    <span className="stat-label">{card.label}</span>
                    <span className={`stat-mark stat-mark-${card.tone}`} aria-hidden="true" />
                  </div>
                  <p className="stat-value">
                    {loadingStats || statsError ? '—' : (stats?.[card.key] ?? 0)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="board-toolbar" aria-label="Search and filter applications">
            <label className="search-control">
              <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8" /><path d="m13.2 13.2 4 4" /></svg>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  requestNumber.current += 1;
                  setSearch(event.target.value);
                }}
                placeholder="Search company or job title"
                aria-label="Search by company or job title"
              />
            </label>
            <label className="status-filter-control">
              <span>Status</span>
              <select value={status} onChange={(event) => {
                requestNumber.current += 1;
                setStatus(event.target.value);
              }} aria-label="Filter by status">
                <option value="">All statuses</option>
                {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="sort-control">
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort applications by">
                <option value="applicationDate">Application date</option>
                <option value="companyName">Company name</option>
              </select>
              <select value={order} onChange={(event) => setOrder(event.target.value)} aria-label="Sort direction">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
            {hasFilters && <Button className="clear-filters-button" onClick={clearFilters}>Clear filters</Button>}
          </section>

          {createSuccess && <p className="success-message" role="status">{createSuccess}</p>}

          <KanbanBoard
            applications={applications}
            loading={loadingApplications}
            error={applicationsError}
            onRetry={() => refreshApplications({ search: search.trim(), status, sortBy, order })}
            noResults={hasFilters && applications.length === 0}
            onClearFilters={clearFilters}
            onSelectApplication={(application) => {
              setCreateSuccess('');
              setEditError('');
              setEditingApplication(application);
            }}
            onStatusChange={changeApplicationStatus}
            onDeleteApplication={removeApplication}
            pendingStatusIds={pendingStatusIds}
            statusErrors={statusErrors}
          />
        </main>
      </div>
      {showApplicationForm && (
        <ApplicationForm
          saving={savingApplication}
          error={createError}
          onClose={() => setShowApplicationForm(false)}
          onSubmit={saveApplication}
        />
      )}
      {editingApplication && (
        <ApplicationForm
          key={editingApplication._id}
          application={editingApplication}
          saving={savingEdit}
          error={editError}
          onClose={() => setEditingApplication(null)}
          onSubmit={saveEdit}
        />
      )}
    </div>
  );
}

export default App;

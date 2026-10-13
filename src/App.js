import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ErrorMessage, LoadingState } from './components/UI';
import KanbanBoard from './components/KanbanBoard';
import { getApplicationStats, listApplications } from './services/applicationApi';
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
      refreshApplications({ search: search.trim(), status });
    }, 300);
    return () => clearTimeout(timer);
  }, [refreshApplications, search, status]);

  const clearFilters = () => {
    requestNumber.current += 1;
    setSearch('');
    setStatus('');
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
          <Button className="add-job-button">
            <span className="plus-icon" aria-hidden="true">+</span>
            <span>Add Job</span>
          </Button>
        </header>

        <main className="dashboard-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR OVERVIEW</p>
              <h1>Dashboard</h1>
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
            {hasFilters && <Button className="clear-filters-button" onClick={clearFilters}>Clear filters</Button>}
          </section>

          <KanbanBoard
            applications={applications}
            loading={loadingApplications}
            error={applicationsError}
            onRetry={() => refreshApplications({ search: search.trim(), status })}
            noResults={hasFilters && applications.length === 0}
            onClearFilters={clearFilters}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

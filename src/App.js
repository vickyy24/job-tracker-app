import { useCallback, useEffect, useState } from 'react';
import { Button, ErrorMessage, LoadingState } from './components/UI';
import { getApplicationStats } from './services/applicationApi';
import './App.css';

const statCards = [
  { label: 'Total Applications', key: 'totalApplications', tone: 'purple' },
  { label: 'Interviews', key: 'interviews', tone: 'blue' },
  { label: 'Offers', key: 'offers', tone: 'green' },
  { label: 'Rejections', key: 'rejections', tone: 'rose' },
];

function App() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const refreshStats = useCallback(() => {
    setLoadingStats(true);
    setStatsError('');

    return getApplicationStats()
      .then(setStats)
      .catch((error) => setStatsError(error.message))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

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

          <section className="content-placeholder" aria-label="Dashboard content area">
            <div className="placeholder-heading">
              <div>
                <h2>Your job search</h2>
                <p>Applications and progress at a glance</p>
              </div>
              <span className="placeholder-period">Overview</span>
            </div>
            <div className="placeholder-body">
              <span className="placeholder-ring" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M16 7v18M7 16h18" />
                </svg>
              </span>
              <p>Your dashboard is ready for your first application.</p>
              <span>Use “Add Job” to start building your overview.</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;

import './App.css';

function App() {
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
          <button className="add-job-button" type="button">
            <span className="plus-icon" aria-hidden="true">+</span>
            <span>Add Job</span>
          </button>
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

          <section className="welcome-panel" aria-labelledby="welcome-title">
            <div className="welcome-copy">
              <p className="eyebrow">JOB SEARCH WORKSPACE</p>
              <h2 id="welcome-title">Every opportunity, thoughtfully organized.</h2>
              <p>Your applications, conversations, and next steps will live here.</p>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit art-orbit-one" />
              <div className="art-orbit art-orbit-two" />
              <div className="art-card art-card-back" />
              <div className="art-card art-card-front">
                <span className="art-card-mark" />
                <span className="art-card-line art-card-line-long" />
                <span className="art-card-line" />
                <span className="art-card-pill" />
              </div>
              <span className="art-sparkle">✦</span>
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

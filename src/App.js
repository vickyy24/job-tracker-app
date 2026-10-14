import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal } from './components/UI';
import KanbanBoard from './components/KanbanBoard';
import ApplicationForm from './components/ApplicationForm';
import { ApplicationList, AssetsPage, Overview, SettingsPage } from './components/AppPages';
import Icon from './components/Icon';
import { createApplication, deleteApplication as deleteApplicationRequest, getApplicationStats, listApplications, updateApplication } from './services/applicationApi';
import './App.css';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const readPreference = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
function readRoute() {
  const hashRoute = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  const pathRoute = window.location.pathname.replace(/^\//, '').split('/')[0];
  const route = pathRoute || hashRoute;
  if (route === 'home' || route === 'statistics' || !['dashboard', 'board', 'assets', 'settings'].includes(route)) return 'dashboard';
  return route;
}

function App() {
  const [page, setPage] = useState(readRoute);
  const [themeMode, setThemeMode] = useState(() => readPreference('job-tracker-theme', 'light') === 'dark' ? 'dark' : 'light');
  const theme = themeMode;
  const [workspace, setWorkspace] = useState(() => readPreference('job-tracker-workspace', 'Job Hunt 2025'));
  const [dailyGoal, setDailyGoal] = useState(() => Number(readPreference('job-tracker-daily-goal', '5')) || 5);
  const [viewMode, setViewMode] = useState(() => readPreference('job-tracker-view', 'board'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readPreference('job-tracker-sidebar-collapsed', 'false') === 'true');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [applications, setApplications] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState('');
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('applicationDate');
  const [order, setOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [newStatus, setNewStatus] = useState('Applied');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [pendingIds, setPendingIds] = useState(new Set());
  const [statusErrors, setStatusErrors] = useState({});
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [workspaceEditOpen, setWorkspaceEditOpen] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState(workspace);
  const [workspaceError, setWorkspaceError] = useState('');
  const requestNumber = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('job-tracker-theme', themeMode);
  }, [theme, themeMode]);
  useEffect(() => { localStorage.setItem('job-tracker-workspace', workspace); }, [workspace]);
  useEffect(() => { localStorage.setItem('job-tracker-daily-goal', String(dailyGoal)); }, [dailyGoal]);
  useEffect(() => { localStorage.setItem('job-tracker-view', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('job-tracker-sidebar-collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => {
    const update = () => setPage(readRoute());
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('hashchange', update); };
  }, []);
  useEffect(() => {
    const route = readRoute();
    if (window.location.pathname !== `/${route}` || window.location.hash) window.history.replaceState({}, '', `/${route}`);
  }, []);
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileNavOpen(false); };
    const closeOnDesktop = () => { if (window.innerWidth > 760) setMobileNavOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); window.removeEventListener('resize', closeOnDesktop); };
  }, [mobileNavOpen]);

  const navigate = (next) => { setPage(next); setMobileNavOpen(false); window.history.pushState({}, '', `/${next}`); };
  const refreshStats = useCallback(() => {
    setLoadingStats(true); setStatsError('');
    return getApplicationStats().then(setStats).catch((error) => setStatsError(error.message)).finally(() => setLoadingStats(false));
  }, []);
  const refreshApplications = useCallback((filters = {}) => {
    const requestId = ++requestNumber.current; setLoadingApplications(true); setApplicationsError('');
    return listApplications(filters).then((result) => { if (requestId === requestNumber.current) setApplications(result.data); })
      .catch((error) => { if (requestId === requestNumber.current) setApplicationsError(error.message); })
      .finally(() => { if (requestId === requestNumber.current) setLoadingApplications(false); });
  }, []);
  const refreshRecentApplications = useCallback(() => {
    setLoadingRecent(true);
    setRecentError('');
    return listApplications({ sortBy: 'createdAt', order: 'desc' })
      .then((result) => setRecentApplications(result.data.slice(0, 5)))
      .catch((error) => setRecentError(error.message))
      .finally(() => setLoadingRecent(false));
  }, []);
  const currentFilters = () => ({ search: search.trim(), status, sortBy, order });
  useEffect(() => { refreshStats(); }, [refreshStats]);
  useEffect(() => { refreshRecentApplications(); }, [refreshRecentApplications]);
  useEffect(() => { const timer = setTimeout(() => refreshApplications({ search: search.trim(), status, sortBy, order }), 250); return () => clearTimeout(timer); }, [search, status, sortBy, order, refreshApplications]);
  const clearFilters = () => { requestNumber.current += 1; setSearch(''); setStatus(''); };

  const saveApplication = async (application) => {
    setSaving(true); setFormError('');
    try { await createApplication(application); setShowForm(false); setMessage('Application added.'); refreshApplications(currentFilters()); refreshRecentApplications(); refreshStats(); }
    catch (error) { setFormError(error.message); } finally { setSaving(false); }
  };
  const saveEdit = async (updates) => {
    setSaving(true); setEditError('');
    try { await updateApplication(editing._id, updates); setEditing(null); setMessage('Application updated.'); refreshApplications(currentFilters()); refreshRecentApplications(); refreshStats(); }
    catch (error) { setEditError(error.message); } finally { setSaving(false); }
  };
  const changeStatus = async (application, nextStatus) => {
    setPendingIds((current) => new Set(current).add(application._id)); setStatusErrors((current) => ({ ...current, [application._id]: '' }));
    try {
      await updateApplication(application._id, { status: nextStatus });
      setApplications((current) => current.map((item) => item._id === application._id ? { ...item, status: nextStatus } : item).filter((item) => !status || item.status === status));
      setMessage('Application status updated.'); refreshRecentApplications(); refreshStats();
    } catch (error) { setStatusErrors((current) => ({ ...current, [application._id]: error.message })); }
    finally { setPendingIds((current) => { const next = new Set(current); next.delete(application._id); return next; }); }
  };
  const confirmDelete = async () => {
    setDeleting(true); setDeleteError('');
    try { await deleteApplicationRequest(deleteTarget._id); setApplications((current) => current.filter((item) => item._id !== deleteTarget._id)); setDeleteTarget(null); setMessage('Application deleted.'); refreshRecentApplications(); refreshStats(); }
    catch (error) { setDeleteError(error.message); } finally { setDeleting(false); }
  };
  const openCreate = (selectedStatus = 'Applied') => { setNewStatus(selectedStatus); setFormError(''); setShowForm(true); };
  const applicationsToday = stats?.applicationsToday || 0;
  const navItems = [ ['dashboard', 'Dashboard'], ['board', 'Board'] ];

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-theme={theme}>
    <button className="mobile-menu-button" type="button" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={mobileNavOpen}><Icon name="list"/></button>
    {mobileNavOpen && <button className="mobile-overlay" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}/>}
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-heading"><a className="brand" href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('dashboard'); }} aria-label="Jobtrack Dashboard"><span className="brand-mark">J</span><span className="brand-name">job<span>track</span></span></a><button className="sidebar-collapse" type="button" title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed((value) => !value)}><Icon name={sidebarCollapsed ? 'expand' : 'collapse'} size={17}/></button></div>
      <nav className="primary-nav" aria-label="Main navigation">
        {navItems.map(([key, label]) => <a className={`nav-link ${page === key ? 'nav-link-active' : ''}`} href={`/${key}`} aria-label={label} title={sidebarCollapsed ? label : undefined} aria-current={page === key ? 'page' : undefined} key={key} onClick={(event) => { event.preventDefault(); navigate(key); }}><Icon name={key === 'board' ? 'board' : 'stats'}/><span>{label}</span></a>)}
        <a className={`nav-link ${page === 'assets' ? 'nav-link-active' : ''}`} href="/assets" aria-label="Assets" title={sidebarCollapsed ? 'Assets' : undefined} aria-current={page === 'assets' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setAssetsExpanded((value) => !value); navigate('assets'); }}><Icon name="assets"/><span>Assets</span><Icon className="nav-chevron" name="down" size={14}/></a>
        {assetsExpanded && <button className="nav-sublink" type="button" onClick={() => navigate('assets')}>Saved resources</button>}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile-row"><span className="profile-avatar">J</span><span className="profile-copy"><strong>Job Tracker</strong><small>Personal workspace</small></span><button type="button" aria-label="Open settings" title="Settings" onClick={() => navigate('settings')}><Icon name="settings" size={16}/></button></div>
        <p className="sidebar-tagline"><span className="footer-dot"/><span>Keep your job search moving</span></p>
      </div>
    </aside>
    <div className="main-area">
      <header className="topbar">
        <div className="workspace-title"><div><strong>{workspace}</strong><button className="icon-button" aria-label="Edit workspace title" onClick={() => { setWorkspaceDraft(workspace); setWorkspaceError(''); setWorkspaceEditOpen(true); }}><Icon name="pencil" size={15}/></button></div></div>
        <div className="topbar-actions"><div className="daily-goal"><Icon name="goal" size={16}/><span>Daily Goal</span><span className="goal-track"><i style={{ width: `${Math.min(100, Math.round(applicationsToday / dailyGoal * 100))}%` }}/></span><strong>{applicationsToday}/{dailyGoal}</strong></div><button className="topbar-theme-toggle" type="button" onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={themeMode === 'dark'} title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}><Icon name={themeMode === 'dark' ? 'sun' : 'moon'} size={17}/></button><Button className="add-job-button" onClick={() => openCreate()}><span className="plus-icon">+</span><span>Add Job</span></Button></div>
      </header>
      <main className="dashboard-main">
        {page === 'board' && <>
          <div className="board-toolbar" aria-label="Search and board controls">
            <label className="search-control"><Icon name="search" size={16}/><input type="search" value={search} onChange={(event) => { requestNumber.current += 1; setSearch(event.target.value); }} placeholder="Search company, job title, or notes…" aria-label="Search by company, job title, or notes"/></label>
            <select className="status-filter" value={status} onChange={(event) => { requestNumber.current += 1; setStatus(event.target.value); }} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
            <div className="toolbar-spacer"/>
            <label className="sort-control"><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort applications by"><option value="applicationDate">Application date</option><option value="createdAt">Created date</option><option value="companyName">Company name</option><option value="jobTitle">Job title</option></select></label>
            <select className="direction-select" value={order} onChange={(event) => setOrder(event.target.value)} aria-label="Sort direction"><option value="desc">Descending</option><option value="asc">Ascending</option></select>
            <div className="view-toggle" role="group" aria-label="View mode"><button className={viewMode === 'board' ? 'active' : ''} onClick={() => setViewMode('board')} aria-label="Board view"><Icon name="grid" size={16}/></button><button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="List view"><Icon name="list" size={16}/></button></div>
            {Boolean(search.trim() || status) && <button className="clear-filters-button" onClick={clearFilters}>Clear</button>}
          </div>
          {message && <p className="success-message" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss message"><Icon name="close" size={14}/></button></p>}
          {viewMode === 'board' ? <KanbanBoard applications={applications} loading={loadingApplications} error={applicationsError} onRetry={() => refreshApplications(currentFilters())} noResults={Boolean(search.trim() || status) && applications.length === 0 && !applicationsError} onClearFilters={clearFilters} onSelectApplication={(item) => { setEditing(item); setEditError(''); }} onAddApplication={openCreate} onFilterStatus={(nextStatus) => setStatus(nextStatus)} onStatusChange={changeStatus} onDeleteApplication={(item) => { setDeleteTarget(item); setDeleteError(''); }} pendingStatusIds={pendingIds} statusErrors={statusErrors}/>
            : <ApplicationList applications={applications} loading={loadingApplications} error={applicationsError} onRetry={() => refreshApplications(currentFilters())} onSelect={(item) => { setEditing(item); setEditError(''); }} onStatusChange={changeStatus} onDelete={(item) => { setDeleteTarget(item); setDeleteError(''); }} pendingIds={pendingIds}/>}
        </>}
        {page === 'dashboard' && <Overview stats={stats} loading={loadingStats} error={statsError} onRetry={refreshStats} applications={recentApplications} loadingApplications={loadingRecent} applicationsError={recentError} onRetryApplications={refreshRecentApplications} onSelectApplication={(item) => { setEditing(item); setEditError(''); }} onOpenBoard={() => navigate('board')} onAdd={() => openCreate()}/>}
        {page === 'assets' && <AssetsPage onBoard={() => navigate('board')}/>}
        {page === 'settings' && <SettingsPage workspace={workspace} onWorkspaceChange={setWorkspace} dailyGoal={dailyGoal} onDailyGoalChange={setDailyGoal}/>}
        {!['dashboard', 'board', 'assets', 'settings'].includes(page) && <Overview stats={stats} loading={loadingStats} error={statsError} onRetry={refreshStats} applications={recentApplications} loadingApplications={loadingRecent} applicationsError={recentError} onRetryApplications={refreshRecentApplications} onSelectApplication={(item) => { setEditing(item); setEditError(''); }} onOpenBoard={() => navigate('board')} onAdd={() => openCreate()}/>}
      </main>
    </div>
    {showForm && <ApplicationForm saving={saving} error={formError} initialStatus={newStatus} onClose={() => setShowForm(false)} onSubmit={saveApplication}/>}
    {editing && <ApplicationForm key={editing._id} application={editing} saving={saving} error={editError} onClose={() => setEditing(null)} onSubmit={saveEdit}/>}
    {deleteTarget && <Modal className="delete-confirmation" role="alertdialog" labelledBy="delete-title" describedBy="delete-description" onClose={() => !deleting && setDeleteTarget(null)} closeDisabled={deleting}><p className="eyebrow">DELETE APPLICATION</p><h2 id="delete-title">Delete {deleteTarget.companyName}?</h2><p id="delete-description">This will permanently delete the application for {deleteTarget.jobTitle}.</p>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<div className="form-actions"><Button variant="secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button className="confirm-delete-button" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting…' : 'Delete application'}</Button></div></Modal>}
    {workspaceEditOpen && <Modal className="application-modal" labelledBy="workspace-edit-title" onClose={() => setWorkspaceEditOpen(false)}><div className="modal-heading"><div><p className="eyebrow">WORKSPACE</p><h2 id="workspace-edit-title">Edit workspace title</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={() => setWorkspaceEditOpen(false)}>×</button></div><form className="application-form" onSubmit={(event) => { event.preventDefault(); if (!workspaceDraft.trim()) { setWorkspaceError('Enter a workspace title.'); return; } setWorkspace(workspaceDraft.trim()); setWorkspaceEditOpen(false); }}><label className="settings-field">Title<input autoFocus value={workspaceDraft} maxLength={50} onChange={(event) => { setWorkspaceDraft(event.target.value); setWorkspaceError(''); }}/></label>{workspaceError && <p className="form-error" role="alert">{workspaceError}</p>}<div className="form-actions"><Button variant="secondary" onClick={() => setWorkspaceEditOpen(false)}>Cancel</Button><Button type="submit">Save title</Button></div></form></Modal>}
  </div>;
}

export default App;

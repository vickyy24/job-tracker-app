import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal } from './components/UI';
import KanbanBoard from './components/KanbanBoard';
import ApplicationForm from './components/ApplicationForm';
import { ApplicationDetails, ApplicationList, AssetsPage, Overview, SettingsPage } from './components/AppPages';
import Icon from './components/Icon';
import { createApplication, deleteApplication as deleteApplicationRequest, getApplicationStats, listApplications, updateApplication } from './services/applicationApi';
import { useAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';


const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
function readRoute() {
  const hashRoute = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  const pathRoute = window.location.pathname.replace(/^\//, '').split('/')[0];
  const route = pathRoute || hashRoute;
  if (route === 'home' || route === 'statistics' || !['dashboard', 'board', 'assets', 'settings'].includes(route)) return 'dashboard';
  return route;
}

function WorkspaceApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState(readRoute);
  const [themeMode, setThemeMode] = useState('light');
  const theme = themeMode;
  const [workspace, setWorkspace] = useState('Job Hunt 2025');
  const [dailyGoal, setDailyGoal] = useState(5);
  const [viewMode, setViewMode] = useState('board');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [applications, setApplications] = useState([]);
  const [chartApplications, setChartApplications] = useState([]);
  const [loadingChartApplications, setLoadingChartApplications] = useState(true);
  const [chartApplicationsError, setChartApplicationsError] = useState('');
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
  const [viewing, setViewing] = useState(null);
  const [editError, setEditError] = useState('');
  const [pendingIds, setPendingIds] = useState(new Set());
  const [statusErrors, setStatusErrors] = useState({});
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
  }, [theme, themeMode]);
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
  useEffect(() => { setSearch(''); setStatus(''); }, [page]);
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
  const refreshChartApplications = useCallback(() => {
    setLoadingChartApplications(true); setChartApplicationsError('');
    return listApplications({ sortBy: 'applicationDate', order: 'desc' })
      .then((result) => setChartApplications(result.data))
      .catch((error) => setChartApplicationsError(error.message))
      .finally(() => setLoadingChartApplications(false));
  }, []);
  const currentFilters = () => ({ search: search.trim(), status, sortBy, order });
  useEffect(() => { refreshStats(); }, [refreshStats]);
  useEffect(() => { refreshChartApplications(); }, [refreshChartApplications]);
  useEffect(() => { const timer = setTimeout(() => refreshApplications({ search: search.trim(), status, sortBy, order }), 250); return () => clearTimeout(timer); }, [search, status, sortBy, order, refreshApplications]);
  const clearFilters = () => { requestNumber.current += 1; setSearch(''); setStatus(''); };

  const saveApplication = async (application) => {
    setSaving(true); setFormError('');
    try { await createApplication(application); setShowForm(false); refreshApplications(currentFilters()); refreshChartApplications(); refreshStats(); }
    catch (error) { setFormError(error.message); } finally { setSaving(false); }
  };
  const saveEdit = async (updates) => {
    setSaving(true); setEditError('');
    try { await updateApplication(editing._id, updates); setEditing(null); refreshApplications(currentFilters()); refreshChartApplications(); refreshStats(); }
    catch (error) { setEditError(error.message); } finally { setSaving(false); }
  };
  const changeStatus = async (application, nextStatus) => {
    setPendingIds((current) => new Set(current).add(application._id)); setStatusErrors((current) => ({ ...current, [application._id]: '' }));
    const previousApplications = applications;
    setApplications((current) => current
      .map((item) => item._id === application._id ? { ...item, status: nextStatus } : item)
      .filter((item) => !status || item.status === status));
    try {
      await updateApplication(application._id, { status: nextStatus });
      refreshChartApplications(); refreshStats();
    } catch (error) {
      setApplications(previousApplications);
      setStatusErrors((current) => ({ ...current, [application._id]: error.message }));
    }
    finally { setPendingIds((current) => { const next = new Set(current); next.delete(application._id); return next; }); }
  };
  const confirmDelete = async () => {
    setDeleting(true); setDeleteError('');
    try { await deleteApplicationRequest(deleteTarget._id); setApplications((current) => current.filter((item) => item._id !== deleteTarget._id)); setDeleteTarget(null); refreshChartApplications(); refreshStats(); }
    catch (error) { setDeleteError(error.message); } finally { setDeleting(false); }
  };
  const openCreate = (selectedStatus = 'Applied') => { setNewStatus(selectedStatus); setFormError(''); setShowForm(true); };
  const openDetails = (application) => setViewing(application);
  const openEdit = (application) => { setViewing(null); setEditError(''); setEditing(application); };
  const navItems = [ ['dashboard', 'Dashboard'], ['board', 'Board'] ];

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} max-[1100px]:[&_.stats-grid]:gap-2 max-[760px]:[--sidebar-width:220px] max-[760px]:[&_.dashboard-insights]:grid-cols-1 max-[760px]:[&_.chart-card]:min-h-[205px] max-[760px]:[&_.profile-copy]:grid max-[760px]:[&.sidebar-collapsed_.sidebar]:items-stretch max-[760px]:[&.sidebar-collapsed_.sidebar]:px-[13px] max-[760px]:[&.sidebar-collapsed_.sidebar-collapse]:hidden max-[760px]:[&.sidebar-collapsed_.sidebar-heading]:flex-row max-[760px]:[&.sidebar-collapsed_.brand]:justify-start max-[760px]:[&.sidebar-collapsed_.brand]:px-2 max-[760px]:[&.sidebar-collapsed_.brand-name]:block max-[760px]:[&.sidebar-collapsed_.nav-link>span]:block max-[760px]:[&.sidebar-collapsed_.nav-chevron]:block max-[760px]:[&.sidebar-collapsed_.nav-sublink]:block max-[760px]:[&.sidebar-collapsed_.profile-copy]:grid max-[760px]:[&.sidebar-collapsed_.sidebar-tagline>span:last-child]:block max-[760px]:[&.sidebar-collapsed_.primary-nav]:w-auto max-[760px]:[&.sidebar-collapsed_.nav-link]:justify-start max-[760px]:[&.sidebar-collapsed_.nav-link]:px-[10px] max-[760px]:[&.sidebar-collapsed_.profile-row]:justify-start max-[760px]:[&.sidebar-collapsed_.profile-row]:gap-[9px] max-[760px]:[&.sidebar-collapsed_.profile-row]:py-[11px] max-[760px]:[&.sidebar-collapsed_.profile-row]:px-1 max-[760px]:[&.sidebar-collapsed_.profile-row_button]:w-7 max-[760px]:[&.sidebar-collapsed_.sidebar-tagline]:justify-start max-[390px]:[&_.stats-grid]:gap-[7px] max-[390px]:[&_.stat-label]:text-[11px] max-[390px]:[&_.page-heading]:items-start max-[390px]:[&_.page-heading]:gap-[10px] max-[760px]:[&_.page-heading_h1]:text-[22px] max-[390px]:[&_.page-heading_h1]:text-[20px] max-[390px]:[&_.page-heading_.ui-button]:px-2 max-[390px]:[&_.page-heading_.ui-button]:text-[10px] max-[390px]:[&_.appearance-options]:flex-wrap motion-reduce:[&_*]:scroll-auto motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none`} data-theme={theme}>
    <button className={`mobile-menu-button max-[760px]:fixed max-[760px]:z-[8] max-[760px]:top-[13px] max-[760px]:left-3 max-[760px]:grid max-[760px]:place-items-center max-[760px]:w-[34px] max-[760px]:h-[34px] max-[760px]:rounded-[7px] ${mobileNavOpen ? 'mobile-menu-button-open' : ''}`} type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen}><Icon name={mobileNavOpen ? 'close' : 'list'}/></button>
    {mobileNavOpen && <button className="mobile-overlay max-[760px]:fixed max-[760px]:z-[4] max-[760px]:inset-0 max-[760px]:block max-[760px]:w-full max-[760px]:h-full max-[760px]:p-0 max-[760px]:border-0" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}/>}
    <aside className={`sidebar max-[760px]:w-[var(--sidebar-width)] max-[760px]:-translate-x-full max-[760px]:transition-transform max-[760px]:shadow-none ${mobileNavOpen ? 'sidebar-open max-[760px]:translate-x-0 max-[760px]:shadow-[8px_0_28px_rgba(0,0,0,0.12)]' : ''}`}>
      <div className="sidebar-heading"><a className="brand" href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('dashboard'); }} aria-label="Jobtrack Dashboard"><span className="brand-mark">J</span><span className="brand-name">job<span>track</span></span></a><button className="sidebar-collapse" type="button" title={mobileNavOpen ? 'Close navigation' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={mobileNavOpen ? 'Close navigation' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => { if (window.matchMedia('(max-width: 760px)').matches) { setMobileNavOpen(false); setSidebarCollapsed(false); } else { setSidebarCollapsed((value) => !value); } }}><Icon name={mobileNavOpen ? 'close' : sidebarCollapsed ? 'expand' : 'collapse'} size={17}/></button></div>
      <nav className="primary-nav" aria-label="Main navigation">
        {navItems.map(([key, label]) => <a className={`nav-link ${page === key ? 'nav-link-active' : ''}`} href={`/${key}`} aria-label={label} title={sidebarCollapsed ? label : undefined} aria-current={page === key ? 'page' : undefined} key={key} onClick={(event) => { event.preventDefault(); navigate(key); }}><Icon name={key === 'board' ? 'board' : 'stats'}/><span>{label}</span></a>)}
        <a className={`nav-link ${page === 'assets' ? 'nav-link-active' : ''}`} href="/assets" aria-label="Assets" title={sidebarCollapsed ? 'Assets' : undefined} aria-current={page === 'assets' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setAssetsExpanded((value) => !value); navigate('assets'); }}><Icon name="assets"/><span>Assets</span><Icon className="nav-chevron" name="down" size={14}/></a>
        {assetsExpanded && <button className="nav-sublink" type="button" onClick={() => navigate('assets')}>Saved resources</button>}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile-row"><span className="profile-avatar">{((user?.email || user?.username)?.[0] || 'J').toUpperCase()}</span><span className="profile-copy"><strong>{user?.email || user?.username || 'User'}</strong><small title={user?.email || user?.username || 'Personal workspace'}>{user?.email || user?.username || 'Personal workspace'}</small></span><button className="profile-settings-button" type="button" aria-label="Open settings" title="Settings" onClick={() => navigate('settings')}><Icon name="settings" size={16}/></button><button className="profile-logout-button" type="button" aria-label="Sign out" title="Sign out" onClick={logout}><Icon name="logout" size={16}/></button></div>
        <p className="sidebar-tagline"><span className="footer-dot"/><span>Keep your job search moving</span></p>
      </div>
    </aside>
    <div className="main-area max-[760px]:ml-0">
      <header className="topbar max-[1100px]:px-4 max-[760px]:h-[58px] max-[760px]:py-0 max-[760px]:pr-[10px] max-[760px]:pl-[54px]">
        <div className="workspace-title"><div><strong>{workspace}</strong><button className="icon-button" aria-label="Edit workspace title" onClick={() => { setWorkspaceDraft(workspace); setWorkspaceError(''); setWorkspaceEditOpen(true); }}><Icon name="pencil" size={15}/></button></div></div>
        <div className="topbar-actions max-[760px]:gap-[6px] max-[390px]:ml-auto"><div className="daily-goal" aria-label={`Daily application goal: ${loadingStats ? 'loading' : stats?.applicationsToday ?? 0} of ${dailyGoal} applications created today (UTC)`}><Icon name="goal" size={16}/><span>Daily Goal</span><span className="goal-track" aria-hidden="true"><i style={{ width: `${Math.min(100, ((stats?.applicationsToday || 0) / dailyGoal) * 100)}%` }}/></span><strong>{loadingStats ? '—' : stats?.applicationsToday ?? 0}/{dailyGoal}</strong></div><button className="topbar-theme-toggle" type="button" onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={themeMode === 'dark'} title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}><Icon name={themeMode === 'dark' ? 'moon' : 'sun'} size={17}/></button></div>
      </header>
      <main className="dashboard-main max-[1100px]:py-3 max-[1100px]:px-[14px] max-[760px]:py-3 max-[760px]:px-[10px] max-[390px]:pr-2 max-[390px]:pl-2">
        {page === 'board' && <>
          <div className="board-toolbar max-[900px]:min-[761px]:flex-wrap max-[760px]:flex-wrap" aria-label="Search and board controls">
            <label className="search-control max-[900px]:min-[761px]:flex-[1_1_250px] max-[760px]:w-auto max-[760px]:flex-[1_1_100%]"><Icon name="search" size={16}/><input type="search" value={search} onChange={(event) => { requestNumber.current += 1; setSearch(event.target.value); }} placeholder="Search company or job title…" aria-label="Search by company or job title"/></label>
            <select className="status-filter max-[760px]:flex-1" value={status} onChange={(event) => { requestNumber.current += 1; setStatus(event.target.value); }} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
            <div className="toolbar-spacer max-[900px]:min-[761px]:hidden max-[760px]:hidden"/>
            <label className="sort-control max-[900px]:min-[761px]:ml-auto max-[760px]:flex-1 max-[390px]:gap-1"><span>Sort by</span><select className="max-[760px]:max-w-[100px] max-[390px]:max-w-[75px]" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort applications by"><option value="applicationDate">Application date</option><option value="createdAt">Created date</option><option value="companyName">Company name</option><option value="jobTitle">Job title</option></select></label>
            <select className="direction-select max-[760px]:flex-1 max-[390px]:max-w-[100px]" value={order} onChange={(event) => setOrder(event.target.value)} aria-label="Sort direction"><option value="desc">Descending</option><option value="asc">Ascending</option></select>
            <div className="view-toggle" role="group" aria-label="View mode"><button className={`${viewMode === 'board' ? 'active' : ''} max-[390px]:w-[27px]`} onClick={() => setViewMode('board')} aria-label="Board view"><Icon name="grid" size={16}/></button><button className={`${viewMode === 'list' ? 'active' : ''} max-[390px]:w-[27px]`} onClick={() => setViewMode('list')} aria-label="List view"><Icon name="list" size={16}/></button></div>
            {Boolean(search.trim() || status) && <button className="clear-filters-button" onClick={clearFilters}>Clear</button>}
          </div>
          {viewMode === 'board' ? <KanbanBoard applications={applications} loading={loadingApplications} error={applicationsError} onRetry={() => refreshApplications(currentFilters())} noResults={Boolean(search.trim() || status) && applications.length === 0 && !applicationsError} onClearFilters={clearFilters} onSelectApplication={openDetails} onAddApplication={openCreate} onFilterStatus={(nextStatus) => setStatus(nextStatus)} onStatusChange={changeStatus} onDeleteApplication={(item) => { setDeleteTarget(item); setDeleteError(''); }} pendingStatusIds={pendingIds} statusErrors={statusErrors}/>
            : <ApplicationList applications={applications} loading={loadingApplications} error={applicationsError} onRetry={() => refreshApplications(currentFilters())} onSelect={openDetails} onEdit={openEdit} onDelete={(item) => { setDeleteTarget(item); setDeleteError(''); }}/>} 
        </>}
        {page === 'dashboard' && <Overview stats={stats} loading={loadingStats} error={statsError} onRetry={refreshStats} applications={applications} chartApplications={chartApplications} loadingChartApplications={loadingChartApplications} chartApplicationsError={chartApplicationsError} onRetryChartApplications={refreshChartApplications} loadingApplications={loadingApplications} applicationsError={applicationsError} onRetryApplications={() => refreshApplications(currentFilters())} onSelectApplication={openDetails} onEditApplication={openEdit} onDeleteApplication={(item) => { setDeleteTarget(item); setDeleteError(''); }} search={search} onSearchChange={(value) => { requestNumber.current += 1; setSearch(value); }} status={status} onStatusFilter={(value) => { requestNumber.current += 1; setStatus(value); }} sortBy={sortBy} onSortByChange={setSortBy} order={order} onOrderChange={setOrder} onClearFilters={clearFilters} onOpenBoard={() => navigate('board')} onAdd={() => openCreate()}/>}
        {page === 'assets' && <AssetsPage onBoard={() => navigate('board')}/>}
        {page === 'settings' && <SettingsPage workspace={workspace} onWorkspaceChange={setWorkspace} dailyGoal={dailyGoal} onDailyGoalChange={setDailyGoal}/>}
        {!['dashboard', 'board', 'assets', 'settings'].includes(page) && <Overview stats={stats} loading={loadingStats} error={statsError} onRetry={refreshStats} applications={applications} loadingApplications={loadingApplications} applicationsError={applicationsError} onRetryApplications={() => refreshApplications(currentFilters())} onSelectApplication={openDetails} onEditApplication={openEdit} onDeleteApplication={(item) => { setDeleteTarget(item); setDeleteError(''); }} search={search} onSearchChange={setSearch} status={status} onStatusFilter={setStatus} sortBy={sortBy} onSortByChange={setSortBy} order={order} onOrderChange={setOrder} onClearFilters={clearFilters} onOpenBoard={() => navigate('board')} onAdd={() => openCreate()}/>}
      </main>
    </div>
    {showForm && <ApplicationForm saving={saving} error={formError} initialStatus={newStatus} onClose={() => setShowForm(false)} onSubmit={saveApplication}/>}
    {editing && <ApplicationForm key={editing._id} application={editing} saving={saving} error={editError} onClose={() => { const application = editing; setEditing(null); setViewing(application); }} onDismiss={() => { setEditing(null); setViewing(null); }} onSubmit={saveEdit}/>}
    {viewing && <ApplicationDetails application={viewing} onClose={() => setViewing(null)} onEdit={openEdit}/>}
    {deleteTarget && <Modal className="delete-confirmation" role="alertdialog" labelledBy="delete-title" describedBy="delete-description" onClose={() => !deleting && setDeleteTarget(null)} closeDisabled={deleting}><p className="eyebrow">DELETE APPLICATION</p><h2 id="delete-title">Delete {deleteTarget.companyName}?</h2><p id="delete-description">This will permanently delete the application for {deleteTarget.jobTitle}.</p>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<div className="form-actions"><Button variant="secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button className="confirm-delete-button" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting…' : 'Delete application'}</Button></div></Modal>}
    {workspaceEditOpen && <Modal className="application-modal" labelledBy="workspace-edit-title" onClose={() => setWorkspaceEditOpen(false)}><div className="modal-heading"><div><p className="eyebrow">WORKSPACE</p><h2 id="workspace-edit-title">Edit workspace title</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={() => setWorkspaceEditOpen(false)}>×</button></div><form className="application-form" onSubmit={(event) => { event.preventDefault(); if (!workspaceDraft.trim()) { setWorkspaceError('Enter a workspace title.'); return; } setWorkspace(workspaceDraft.trim()); setWorkspaceEditOpen(false); }}><label className="settings-field">Title<input autoFocus value={workspaceDraft} maxLength={50} onChange={(event) => { setWorkspaceDraft(event.target.value); setWorkspaceError(''); }}/></label>{workspaceError && <p className="form-error" role="alert">{workspaceError}</p>}<div className="form-actions"><Button variant="secondary" onClick={() => setWorkspaceEditOpen(false)}>Cancel</Button><Button type="submit">Save title</Button></div></form></Modal>}
  </div>;
}

function App() {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== 'restoring' && status !== 'authenticated'
      && !['/login', '/register', '/sign-in', '/sign-up', '/forgot-password', '/reset-password'].includes(window.location.pathname)) {
      window.history.replaceState({}, '', '/login');
    }
  }, [status]);
  if (status === 'restoring') {
    return <main className="auth-page"><div className="auth-restoring" role="status" aria-live="polite">
      <span className="auth-loading-mark" aria-hidden="true"><span className="auth-loading-ring"/><span className="auth-loading-letter">J</span></span>
      <span className="auth-loading-brand">job<strong>track</strong></span>
      <span className="auth-loading-caption"><span className="auth-loading-dots" aria-hidden="true"><i/><i/><i/></span>Restoring your secure session</span>
    </div></main>;
  }
  if (status !== 'authenticated') return <LoginPage key={status}/>;
  return <WorkspaceApp/>;
}

export default App;

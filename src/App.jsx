import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal } from './components/shared';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';
import { ApplicationList } from './components/ApplicationList';
import AssetsPage from './pages/AssetsPage';
import BoardPage from './pages/BoardPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import Icon from './components/Icon';
import ThemeModeIcon from './components/ThemeModeIcon';
import { createApplication, deleteApplication as deleteApplicationRequest, getApplicationStats, listApplications, updateApplication } from './services/applicationApi';
import { useAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';


const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

function readPreference(key, fallback) {
    try {
        return window.localStorage.getItem(`jobtracker.${key}`) ?? fallback;
    } catch {
        return fallback;
    }
}

function savePreference(key, value) {
    try {
        window.localStorage.setItem(`jobtracker.${key}`, String(value));
    } catch {
        // Preferences remain available for the current session if storage is unavailable.
    }
}

function readRoute() {
    const hashRoute = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const pathRoute = window.location.pathname.replace(/^\//, '').split('/')[0];
    const route = pathRoute || hashRoute;
    if (route === 'home' || route === 'statistics' || !['dashboard', 'board', 'assets', 'settings', 'profile'].includes(route)) return 'dashboard';
    return route;
}

function WorkspaceApp() {
    const { user, logout } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const profile = profileUser?.id === user?.id ? profileUser : user;
    const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()
        || profile?.name?.trim()
        || (profile?.username && !profile.username.includes('@') ? profile.username : 'User');
    const [page, setPage] = useState(readRoute);
    const [themeMode, setThemeMode] = useState(() => readPreference('theme', 'light') === 'dark' ? 'dark' : 'light');
    const theme = themeMode;
    const [workspace, setWorkspace] = useState(() => readPreference('workspace', 'Job Hunt 2025'));
    const [dailyGoal, setDailyGoal] = useState(() => {
        const savedGoal = Number(readPreference('dailyGoal', '5'));
        return Number.isInteger(savedGoal) && savedGoal >= 1 && savedGoal <= 100 ? savedGoal : 5;
    });
    const [viewMode, setViewMode] = useState('board');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
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
    const order = 'desc';
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
    useEffect(() => savePreference('theme', themeMode), [themeMode]);
    useEffect(() => savePreference('workspace', workspace), [workspace]);
    useEffect(() => savePreference('dailyGoal', dailyGoal), [dailyGoal]);
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
        if (!profileMenuOpen) return undefined;
        const closeMenu = (event) => {
            if (event.type === 'keydown' && event.key === 'Escape') setProfileMenuOpen(false);
            if (event.type === 'pointerdown' && !profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
        };
        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeMenu);
        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeMenu);
        };
    }, [profileMenuOpen]);
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
        try { await deleteApplicationRequest(deleteTarget._id); setApplications((current) => current.filter((item) => item._id !== deleteTarget._id)); if (editing?._id === deleteTarget._id) setEditing(null); setDeleteTarget(null); refreshChartApplications(); refreshStats(); }
        catch (error) { setDeleteError(error.message); } finally { setDeleting(false); }
    };
    const openCreate = (selectedStatus = 'Applied') => { setNewStatus(selectedStatus); setFormError(''); setShowForm(true); };
    const openDetails = (application) => setViewing(application);
    const openEdit = (application) => { setViewing(null); setEditError(''); setEditing(application); };
    const navItems = [['dashboard', 'Dashboard'], ['board', 'Board']];

    return <div className={`app-shell min-h-screen bg-[var(--canvas)] text-[var(--text)] ${sidebarCollapsed ? 'sidebar-collapsed' : ''} motion-reduce:[&_*]:scroll-auto motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none`} data-theme={theme}>
        <button className={`mobile-menu-button hidden max-[760px]:fixed max-[760px]:z-[7] max-[760px]:top-3 max-[760px]:grid max-[760px]:size-[34px] max-[760px]:place-items-center max-[760px]:rounded-lg max-[760px]:border max-[760px]:border-[var(--border)] max-[760px]:bg-[var(--surface)] max-[760px]:text-[var(--text)] max-[760px]:shadow-[0_2px_8px_rgba(24,20,42,.12)] max-[760px]:cursor-pointer ${mobileNavOpen ? 'max-[760px]:left-[176px] max-[760px]:border-[var(--purple)] max-[760px]:text-[var(--purple)] max-[760px]:shadow-[0_2px_10px_rgba(15,136,131,.2)]' : 'max-[760px]:left-3'}`} type="button" onClick={() => { setSidebarCollapsed(false); setMobileNavOpen((open) => !open); }} aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen}><Icon name={mobileNavOpen ? 'close' : 'list'} /></button>
        {mobileNavOpen && <button className="mobile-overlay hidden max-[760px]:fixed max-[760px]:z-[4] max-[760px]:inset-0 max-[760px]:block max-[760px]:size-full max-[760px]:border-0 max-[760px]:bg-[rgba(15,18,30,.36)] max-[760px]:p-0" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
        <aside className={`sidebar fixed inset-y-0 left-0 z-[5] flex w-[var(--sidebar-width)] flex-col border-r border-[var(--border)] bg-[var(--surface)] px-[13px] pt-[18px] pb-[14px] max-[760px]:z-[6] max-[760px]:h-dvh max-[760px]:w-[220px] max-[760px]:overflow-y-auto max-[760px]:overscroll-contain max-[760px]:-translate-x-full max-[760px]:transition-[transform,box-shadow] ${mobileNavOpen ? 'max-[760px]:translate-x-0 max-[760px]:shadow-[8px_0_28px_rgba(0,0,0,.16)]' : ''}`}>
            <div className="sidebar-heading"><a className="brand" href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('dashboard'); }} aria-label="Jobtrack Dashboard"><img className="brand-mark" src="/favicon.svg" alt="" /><span className="brand-name">job<span>track</span></span></a><button className={`sidebar-collapse ${mobileNavOpen ? 'max-[760px]:hidden' : ''}`} type="button" title={mobileNavOpen ? 'Close navigation' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={mobileNavOpen ? 'Close navigation' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => { if (window.matchMedia('(max-width: 760px)').matches) { setMobileNavOpen(false); setSidebarCollapsed(false); } else { setSidebarCollapsed((value) => !value); } }}><Icon name={mobileNavOpen ? 'close' : sidebarCollapsed ? 'expand' : 'collapse'} size={17} /></button></div>
            <nav className="primary-nav" aria-label="Main navigation">
                {navItems.map(([key, label]) => <a className={`nav-link ${page === key ? 'nav-link-active' : ''}`} href={`/${key}`} aria-label={label} title={sidebarCollapsed ? label : undefined} aria-current={page === key ? 'page' : undefined} key={key} onClick={(event) => { event.preventDefault(); navigate(key); }}><Icon name={key === 'board' ? 'board' : 'stats'} /><span>{label}</span></a>)}
                <a className={`nav-link ${page === 'assets' ? 'nav-link-active' : ''}`} href="/assets" aria-label="Assets" title={sidebarCollapsed ? 'Assets' : undefined} aria-current={page === 'assets' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setAssetsExpanded((value) => !value); navigate('assets'); }}><Icon name="assets" /><span>Assets</span><Icon className="nav-chevron" name="down" size={14} /></a>
                {assetsExpanded && <button className="nav-sublink" type="button" onClick={() => navigate('assets')}>Saved resources</button>}
                <a className={`nav-link ${page === 'settings' ? 'nav-link-active' : ''}`} href="/settings" aria-label="Settings" title={sidebarCollapsed ? 'Settings' : undefined} aria-current={page === 'settings' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); navigate('settings'); }}><Icon name="settings" /><span>Settings</span></a>
            </nav>
            <div className="sidebar-bottom">
                <button className="nav-link sidebar-sign-out" type="button" onClick={logout} aria-label="Sign out" title={sidebarCollapsed ? 'Sign out' : undefined}>
                    <Icon name="logout" />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
        <div className="main-area min-h-screen flex-1 ml-[var(--sidebar-width)] max-[760px]:ml-0 max-[760px]:w-full max-[760px]:min-w-0">
            <header className="topbar sticky top-0 z-[3] flex h-[58px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 max-[1100px]:px-[14px] max-[760px]:h-[58px] max-[760px]:py-0 max-[760px]:pr-[10px] max-[760px]:pl-[54px]">
                <div className="workspace-title max-[760px]:min-w-0 max-[760px]:flex-nowrap"><div className="max-[760px]:min-w-0 max-[760px]:flex-nowrap"><strong className="max-[760px]:flex-none max-[760px]:text-base max-[760px]:leading-none max-[760px]:whitespace-nowrap">{workspace}</strong><button className="icon-button max-[760px]:size-[21px] max-[760px]:flex-none" aria-label="Edit workspace title" onClick={() => { setWorkspaceDraft(workspace); setWorkspaceError(''); setWorkspaceEditOpen(true); }}><Icon name="pencil" size={15} /></button></div></div>
                <div className="topbar-actions max-[760px]:flex-none max-[760px]:gap-[6px] max-[390px]:ml-auto">
                    <div className="daily-goal flex max-[760px]:h-9 max-[760px]:flex-none max-[760px]:gap-[5px] max-[760px]:whitespace-nowrap max-[760px]:px-2 max-[760px]:py-[6px] max-[760px]:text-[10px] max-[760px]:[&>span]:whitespace-nowrap max-[760px]:[&>span]:text-[11px] max-[760px]:[&>svg]:size-[13px] max-[760px]:[&>.goal-track]:w-10 max-[760px]:[&>.goal-track]:flex-none max-[480px]:hidden" aria-label={`Daily application goal: ${loadingStats ? 'loading' : stats?.applicationsToday ?? 0} of ${dailyGoal} applications created today (UTC)`}>
                        <Icon name="goal" size={16} />
                        <span>Daily Goal</span>
                        <span className="goal-track" aria-hidden="true"><i style={{ width: `${Math.min(100, ((stats?.applicationsToday || 0) / dailyGoal) * 100)}%` }} /></span>
                        <strong className="max-[760px]:text-[11px] max-[760px]:whitespace-nowrap">{loadingStats ? '—' : stats?.applicationsToday ?? 0}/{dailyGoal}</strong>
                    </div>
                    <button className="topbar-theme-toggle max-[760px]:size-8 max-[760px]:flex-none" type="button" onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={themeMode === 'dark'} title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}>
                        <ThemeModeIcon mode={themeMode === 'dark' ? 'sun' : 'moon'} />
                    </button>
                    <div className="topbar-profile-menu max-[760px]:flex-none" ref={profileMenuRef}>
                        <button className="topbar-profile-trigger max-[760px]:box-border max-[760px]:h-[34px] max-[760px]:min-h-[34px] max-[760px]:w-[34px] max-[760px]:min-w-[34px] max-[760px]:justify-center max-[760px]:rounded-full max-[760px]:p-[2px]" type="button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label={`Open account menu for ${displayName}`} aria-expanded={profileMenuOpen} aria-haspopup="menu">
                            {profile?.avatar ? <img className="profile-avatar profile-avatar-image" src={profile.avatar} alt="" /> : <span className="profile-avatar"><Icon name="user" size={16} /></span>}
                            <span className="topbar-profile-copy max-[760px]:hidden"><strong title={displayName}>{displayName}</strong></span>
                        </button>
                        {profileMenuOpen && <div className="profile-dropdown" role="menu" aria-label="Account menu">
                            <button className="profile-dropdown-item" type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('profile'); }}>
                                <Icon name="user" size={17} />
                                <span>Profile</span>
                            </button>
                        </div>}
                    </div>
                </div>
            </header>
            <main className="dashboard-main min-h-[calc(100vh-58px)] min-w-0 overflow-x-clip px-5 pt-[14px] pb-[18px] max-[1100px]:px-[14px] max-[1100px]:py-3 max-[760px]:px-[10px] max-[760px]:py-3 max-[390px]:px-2">
                {page === 'board' && <BoardPage
                    applications={applications}
                    loading={loadingApplications}
                    error={applicationsError}
                    search={search}
                    onSearchChange={(value) => { requestNumber.current += 1; setSearch(value); }}
                    status={status}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onClearFilters={clearFilters}
                    onRetry={() => refreshApplications(currentFilters())}
                    onSelect={openDetails}
                    onAdd={openCreate}
                    onFilterStatus={(nextStatus) => setStatus(nextStatus)}
                    onStatusUpdate={changeStatus}
                    onDelete={(item) => { setDeleteTarget(item); setDeleteError(''); }}
                    onEdit={openEdit}
                    pendingStatusIds={pendingIds}
                    statusErrors={statusErrors}
                />}
                {page === 'dashboard' && <DashboardPage stats={stats} loading={loadingStats} error={statsError} onRetry={refreshStats} applications={applications} chartApplications={chartApplications} loadingChartApplications={loadingChartApplications} chartApplicationsError={chartApplicationsError} onRetryChartApplications={refreshChartApplications} loadingApplications={loadingApplications} applicationsError={applicationsError} onRetryApplications={() => refreshApplications(currentFilters())} onSelectApplication={openDetails} onEditApplication={openEdit} search={search} onSearchChange={(value) => { requestNumber.current += 1; setSearch(value); }} status={status} onStatusFilter={(value) => { requestNumber.current += 1; setStatus(value); }} sortBy={sortBy} onSortByChange={setSortBy} onClearFilters={clearFilters} onOpenBoard={() => navigate('board')} onAdd={() => openCreate()} />}
                {page === 'assets' && <AssetsPage onBoard={() => navigate('board')} />}
                {page === 'settings' && <SettingsPage workspace={workspace} onWorkspaceChange={setWorkspace} dailyGoal={dailyGoal} onDailyGoalChange={setDailyGoal} themeMode={themeMode} onThemeChange={setThemeMode} />}
                {page === 'profile' && <ProfilePage user={profile} onUserUpdated={setProfileUser} />}
            </main>
        </div>
        {showForm && <ApplicationForm saving={saving} error={formError} initialStatus={newStatus} onClose={() => setShowForm(false)} onSubmit={saveApplication} />}
        {editing && <ApplicationForm key={editing._id} application={editing} saving={saving} error={editError} onClose={() => { const application = editing; setEditing(null); setViewing(application); }} onDismiss={() => { setEditing(null); setViewing(null); }} onRequestDelete={(application) => { setDeleteTarget(application); setDeleteError(''); }} onSubmit={saveEdit} />}
        {viewing && <ApplicationDetails application={viewing} onClose={() => setViewing(null)} onEdit={openEdit} />}
        {deleteTarget && <Modal className="delete-confirmation" role="alertdialog" labelledBy="delete-title" describedBy="delete-description" onClose={() => !deleting && setDeleteTarget(null)} closeDisabled={deleting}>
            <div className="delete-confirmation-heading">
                <span className="delete-confirmation-icon"><Icon name="trash" size={19} /></span>
                <div><h2 id="delete-title">Delete application?</h2></div>
            </div>
            <p id="delete-description">This action can’t be undone.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="form-actions"><Button variant="secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button className="confirm-delete-button" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting…' : 'Delete'}</Button></div>
        </Modal>}
        {workspaceEditOpen && <Modal className="application-modal" labelledBy="workspace-edit-title" onClose={() => setWorkspaceEditOpen(false)}><div className="modal-heading"><div><p className="eyebrow">WORKSPACE</p><h2 id="workspace-edit-title">Edit workspace title</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={() => setWorkspaceEditOpen(false)}>×</button></div><form className="application-form" onSubmit={(event) => { event.preventDefault(); if (!workspaceDraft.trim()) { setWorkspaceError('Enter a workspace title.'); return; } setWorkspace(workspaceDraft.trim()); setWorkspaceEditOpen(false); }}><label className="settings-field">Title<input autoFocus value={workspaceDraft} maxLength={50} onChange={(event) => { setWorkspaceDraft(event.target.value); setWorkspaceError(''); }} /></label>{workspaceError && <p className="form-error" role="alert">{workspaceError}</p>}<div className="form-actions"><Button variant="secondary" onClick={() => setWorkspaceEditOpen(false)}>Cancel</Button><Button type="submit">Save title</Button></div></form></Modal>}
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
        return <main className="auth-page motion-reduce:[&_.auth-loading-ring]:animate-none motion-reduce:[&_.auth-loading-dots_i]:animate-none"><div className="auth-restoring" role="status" aria-live="polite">
            <span className="auth-loading-mark" aria-hidden="true"><span className="auth-loading-ring" /><span className="auth-loading-letter">J</span></span>
            <span className="auth-loading-brand">job<strong>track</strong></span>
            <span className="auth-loading-caption"><span className="auth-loading-dots" aria-hidden="true"><i /><i /><i /></span>Restoring your secure session</span>
        </div></main>;
    }
    if (status !== 'authenticated') return <LoginPage key={status} />;
    return <WorkspaceApp />;
}

export default App;

import { Button, ErrorMessage, LoadingState } from './UI';
import Icon from './Icon';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const STATUS_COLORS = { Applied: '#7047eb', Interview: '#2584e8', Offer: '#239b75', Rejected: '#cf5a6a' };
const STAT_CARDS = [
  { label: 'Total tracked jobs', key: 'totalApplications', tone: 'purple' },
  { label: 'Applied', key: 'applied', tone: 'purple' },
  { label: 'Interviews', key: 'interviews', tone: 'blue' },
  { label: 'Offers', key: 'offers', tone: 'green' },
  { label: 'Rejections', key: 'rejections', tone: 'rose' },
  { label: 'Added today (UTC)', key: 'applicationsToday', tone: 'blue' },
];

function metricValue(stats, key) {
  if (key === 'applied') return Math.max(0, (stats?.totalApplications || 0) - (stats?.interviews || 0) - (stats?.offers || 0) - (stats?.rejections || 0));
  return stats?.[key] ?? 0;
}

export function Overview({ stats, loading, error, onRetry, applications, loadingApplications, applicationsError, onRetryApplications, onSelectApplication, onOpenBoard, onAdd }) {
  return <section className="page-content dashboard-page">
    <div className="page-heading"><div><p className="eyebrow">YOUR OVERVIEW</p><h1>Dashboard</h1><p>Track your pipeline and keep the next step in view.</p></div><Button variant="secondary" onClick={onOpenBoard}>Open board</Button></div>
    <StatsGrid stats={stats} loading={loading} error={error} onRetry={onRetry}/>
    <div className="dashboard-insights"><StatusChart stats={stats} loading={loading} error={error}/><MonthlyChart stats={stats} loading={loading} error={error}/></div>
    <section className="overview-recent"><header><div><p className="eyebrow">RECENT APPLICATIONS</p><h2>Latest in your pipeline</h2><small>Today’s goal counts applications created today, using UTC.</small></div><Button variant="secondary" onClick={onAdd}>+ Add job</Button></header>
      {loadingApplications ? <LoadingState message="Loading recent applications…"/> : applicationsError ? <ErrorMessage message={applicationsError} onRetry={onRetryApplications}/> : applications.length ? <div className="recent-list">{applications.map((item) => <button key={item._id} onClick={() => onSelectApplication(item)}><span><strong>{item.companyName}</strong><small>{item.jobTitle}</small></span><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status === 'Interview' ? 'Interviewing' : item.status}</span><time>{new Date(item.applicationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></button>)}</div> : <div className="dashboard-empty"><span className="feature-icon"><Icon name="board" size={20}/></span><h3>No applications yet</h3><p>Add the first job and your real application metrics will appear here.</p><Button onClick={onAdd}>Add your first job</Button></div>}
    </section>
  </section>;
}

export function StatsGrid({ stats, loading, error, onRetry }) {
  return <><div className="stats-grid">{STAT_CARDS.map((card) => <article className="stat-card" key={card.key}><div className="stat-card-heading"><span className="stat-label">{card.label}</span><span className={`stat-mark stat-mark-${card.tone}`}/></div><p className="stat-value">{loading || error ? '—' : metricValue(stats, card.key)}</p></article>)}</div>{error && <ErrorMessage message={error} onRetry={onRetry}/>}</>;
}

function StatusChart({ stats, loading, error }) {
  const total = stats?.totalApplications || 0;
  const values = STATUSES.map((status) => ({ status, count: metricValue(stats, status === 'Interview' ? 'interviews' : status === 'Offer' ? 'offers' : status === 'Rejected' ? 'rejections' : 'applied') }));
  return <section className="chart-card" aria-label="Applications by status">
    <header><div><p className="eyebrow">PIPELINE</p><h2>Applications by status</h2></div><span className="chart-total">{loading || error ? '—' : total} total</span></header>
    {loading ? <LoadingState message="Loading status totals…"/> : error ? <p className="chart-message">Status breakdown unavailable.</p> : total === 0 ? <p className="chart-message">Status distribution will appear when you add applications.</p> : <div className="status-chart">{values.map(({ status, count }) => <div className="status-chart-row" key={status}><div><span className="status-dot" style={{ backgroundColor: STATUS_COLORS[status] }}/><span>{status === 'Interview' ? 'Interviewing' : status}</span><strong>{count}</strong></div><div className="bar-track"><span style={{ width: `${count ? Math.max(3, count / total * 100) : 0}%`, backgroundColor: STATUS_COLORS[status] }}/></div></div>)}</div>}
  </section>;
}

function MonthlyChart({ stats, loading, error }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const found = stats?.applicationsByMonth?.find((item) => item.year === date.getUTCFullYear() && item.month === date.getUTCMonth() + 1);
    return { label: date.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }), count: found?.count || 0 };
  });
  const max = Math.max(...months.map((month) => month.count), 1);
  const points = months.map((month, index) => `${25 + index * 54},${110 - month.count / max * 78}`).join(' ');
  const total = months.reduce((sum, month) => sum + month.count, 0);
  return <section className="chart-card" aria-label="Applications created by month">
    <header><div><p className="eyebrow">ACTIVITY</p><h2>Applications over time</h2></div><span className="chart-total">Last 6 months</span></header>
    {loading ? <LoadingState message="Loading activity…"/> : error ? <p className="chart-message">Application history unavailable.</p> : total === 0 ? <p className="chart-message">Monthly activity will appear when applications are created.</p> : <div className="monthly-chart"><svg viewBox="0 0 320 145" role="img" aria-label={`Applications created in the last six months: ${months.map((month) => `${month.label} ${month.count}`).join(', ')}`}><line x1="18" y1="110" x2="302" y2="110" className="chart-axis"/><polyline points={points} className="chart-line"/>{months.map((month, index) => <g key={month.label}><circle cx={25 + index * 54} cy={110 - month.count / max * 78} r="3.5" className="chart-point"/><text x={25 + index * 54} y="132" textAnchor="middle">{month.label}</text></g>)}</svg></div>}
  </section>;
}

export function AssetsPage({ onBoard }) {
  return <section className="page-content"><div className="page-heading"><div><p className="eyebrow">JOB SEARCH MATERIALS</p><h1>Assets</h1><p>Keep helpful resources close to your application workflow.</p></div></div><div className="feature-empty"><span className="feature-icon"><Icon name="assets" size={22}/></span><h2>Resource library isn’t connected yet</h2><p>The current API stores job applications only. No upload controls are shown until the backend supports documents.</p><Button variant="secondary" onClick={onBoard}>Go to board</Button></div></section>;
}

export function SettingsPage({ workspace, onWorkspaceChange, dailyGoal, onDailyGoalChange }) {
  return <section className="page-content settings-page"><div className="page-heading"><div><p className="eyebrow">PREFERENCES</p><h1>Settings</h1><p>Personalize your job-tracking workspace.</p></div></div>
    <section className="settings-card"><h2>Workspace</h2><label className="settings-field">Workspace title<input value={workspace} maxLength={50} onChange={(event) => onWorkspaceChange(event.target.value || 'Job Tracker')}/></label><label className="settings-field">Daily application goal<input type="number" min="1" max="99" value={dailyGoal} onChange={(event) => onDailyGoalChange(Math.min(99, Math.max(1, Number(event.target.value) || 1)))}/><small>Counts records created today in UTC.</small></label></section>
  </section>;
}

export function ApplicationList({ applications, loading, error, onRetry, onSelect, onStatusChange, onDelete, pendingIds }) {
  if (loading) return <LoadingState message="Loading applications…"/>;
  if (error) return <ErrorMessage message={error} onRetry={onRetry}/>;
  return <div className="application-table-wrap"><table className="application-table"><thead><tr><th>Company</th><th>Job title</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead><tbody>{applications.map((item) => <tr key={item._id}><td><button className="table-link" onClick={() => onSelect(item)}>{item.companyName}</button></td><td>{item.jobTitle}</td><td>{new Date(item.applicationDate).toLocaleDateString()}</td><td><select aria-label={`Change status for ${item.companyName}`} value={item.status} disabled={pendingIds.has(item._id)} onChange={(event) => onStatusChange(item, event.target.value)}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></td><td><button className="table-action" onClick={() => onSelect(item)}>Edit</button><button className="table-action danger" onClick={() => onDelete(item)}>Delete</button></td></tr>)}</tbody></table>{!applications.length && <div className="table-empty">No applications match your current filters.</div>}</div>;
}

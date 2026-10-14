import { useEffect, useState } from 'react';
import { Button, ErrorMessage, LoadingState, Modal } from './UI';
import Icon from './Icon';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const STATUS_COLORS = { Applied: '#ff773b', Interview: '#3478f6', Offer: '#8467f7', Rejected: '#e05268' };
const STAT_CARDS = [
  { label: 'Total applications', key: 'totalApplications', tone: 'amber', icon: 'assets' },
  { label: 'Interviews', key: 'interviews', tone: 'teal', icon: 'interviews' },
  { label: 'Offers', key: 'offers', tone: 'green', icon: 'offer' },
  { label: 'Rejections', key: 'rejections', tone: 'rose', icon: 'rejected' },
];

function metricValue(stats, key) {
  if (key === 'applied') return Math.max(0, (stats?.totalApplications || 0) - (stats?.interviews || 0) - (stats?.offers || 0) - (stats?.rejections || 0));
  return stats?.[key] ?? 0;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const title = item.payload?.status || label;
  const count = Number(item.value) || 0;
  if (item.payload?.status) return <div className="chart-tooltip"><strong>{title}</strong><span>{count} {count === 1 ? 'application' : 'applications'} · {item.payload.percent}%</span></div>;
  if (item.dataKey !== 'count') return null;
  return <div className="chart-tooltip"><strong>{title}</strong><span>{count} {count === 1 ? 'application' : 'applications'}</span></div>;
}

export function Overview({ stats, loading, error, onRetry, applications, chartApplications, loadingChartApplications, chartApplicationsError, onRetryChartApplications, loadingApplications, applicationsError, onRetryApplications, onSelectApplication, onEditApplication, onStatusChange, onDeleteApplication, pendingIds, search, onSearchChange, status, onStatusFilter, sortBy, onSortByChange, order, onOrderChange, onClearFilters, onOpenBoard, onAdd }) {
  const [chartRange, setChartRange] = useState(6);
  const [statusRange, setStatusRange] = useState('all');
  return <section className="page-content dashboard-page max-[1100px]:[&_.stats-grid]:grid-cols-3 max-[760px]:[&_.stats-grid]:grid-cols-2 max-[760px]:[&_.stat-card]:min-h-[68px] max-[760px]:[&_.stat-card]:p-[10px]">
    <div className="page-heading"><div><p className="eyebrow">YOUR OVERVIEW</p><h1>Dashboard</h1><p>Track your pipeline and keep the next step in view.</p></div><Button variant="secondary" onClick={onOpenBoard}>Open board</Button></div>
    <StatsGrid stats={stats} loading={loading} error={error} onRetry={onRetry}/>
    <div className="dashboard-insights"><StatusChart applications={chartApplications} loading={loadingChartApplications} error={chartApplicationsError} onRetry={onRetryChartApplications} range={statusRange} onRangeChange={setStatusRange}/><MonthlyChart applications={chartApplications} loading={loadingChartApplications} error={chartApplicationsError} onRetry={onRetryChartApplications} range={chartRange} onRangeChange={setChartRange}/></div>
    <section className="overview-recent"><header><div><p className="eyebrow">APPLICATIONS</p><h2>All applications</h2></div><Button onClick={onAdd}><span className="plus-icon">+</span> Add job</Button></header>
      <div className="dashboard-filters max-[760px]:flex-wrap" aria-label="Filter and sort applications"><label className="search-control max-[760px]:flex-[1_1_100%]"><Icon name="search" size={16}/><input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search company or job title…" aria-label="Search by company or job title"/></label><select className="status-filter max-[760px]:flex-1" value={status} onChange={(event) => onStatusFilter(event.target.value)} aria-label="Filter applications by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><label className="sort-control max-[760px]:flex-1"><span>Sort by</span><select value={sortBy} onChange={(event) => onSortByChange(event.target.value)} aria-label="Sort applications by"><option value="applicationDate">Application date</option><option value="createdAt">Created date</option><option value="companyName">Company name</option><option value="jobTitle">Job title</option></select></label><select className="direction-select max-[760px]:flex-1" value={order} onChange={(event) => onOrderChange(event.target.value)} aria-label="Sort direction"><option value="desc">Descending</option><option value="asc">Ascending</option></select>{Boolean(search.trim() || status) && <button className="clear-filters-button" onClick={onClearFilters}>Clear filters</button>}</div>
      <ApplicationList applications={applications} loading={loadingApplications} error={applicationsError} onRetry={onRetryApplications} onSelect={onSelectApplication} onEdit={onEditApplication} onStatusChange={onStatusChange} onDelete={onDeleteApplication} pendingIds={pendingIds}/>
    </section>
  </section>;
}

export function StatsGrid({ stats, loading, error, onRetry }) {
  return <><div className="stats-grid">{STAT_CARDS.map((card) => <article className={`stat-card stat-card-${card.tone}`} key={card.key}><div className="stat-card-heading"><span className="stat-label">{card.label}</span><Icon name={card.icon} className="stat-icon" size={21}/></div><p className="stat-value">{loading || error ? '—' : metricValue(stats, card.key)}</p></article>)}</div>{error && <ErrorMessage message={error} onRetry={onRetry}/>}</>;
}

function ChartRangeSelect({ range, onRangeChange, label }) {
  return <select className="chart-period-select" value={range} onChange={(event) => onRangeChange(Number(event.target.value))} aria-label={`Filter ${label} by date`}><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select>;
}

function StatusRangeSelect({ range, onRangeChange }) {
  return <select className="chart-period-select" value={range} onChange={(event) => onRangeChange(event.target.value)} aria-label="Filter status breakdown by application date"><option value="all">All time</option><option value="year">This year</option></select>;
}

function getRangeData(applications = [], range) {
  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - range + 1, 1));
  const rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return applications.filter((application) => {
    const date = new Date(application.applicationDate);
    return !Number.isNaN(date.getTime()) && date >= rangeStart && date < rangeEnd;
  });
}

function StatusChart({ applications, loading, error, onRetry, range, onRangeChange }) {
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const visibleApplications = range === 'all'
    ? applications || []
    : (applications || []).filter((application) => {
      const date = new Date(application.applicationDate);
      return !Number.isNaN(date.getTime()) && date >= yearStart && date <= new Date();
    });
  const counts = visibleApplications.reduce((result, application) => {
    if (STATUSES.includes(application.status)) result[application.status] += 1;
    return result;
  }, Object.fromEntries(STATUSES.map((status) => [status, 0])));
  const total = visibleApplications.length;
  const values = STATUSES.map((key) => {
    const count = Number(counts[key]) || 0;
    return { status: key === 'Interview' ? 'Interviewing' : key, count, percent: total ? Math.round(count / total * 100) : 0, color: STATUS_COLORS[key] };
  });
  const populatedValues = values.filter((entry) => entry.count > 0);
  return <section className="chart-card" aria-label="Applications by status">
    <header><div><p className="eyebrow">PIPELINE</p><h2>Status breakdown</h2></div><div className="chart-header-actions"><span className="chart-total">{total} {range === 'all' ? 'total' : 'this year'}</span><StatusRangeSelect range={range} onRangeChange={onRangeChange}/></div></header>
    {loading ? <LoadingState message="Loading status totals…"/> : error ? <div><p className="chart-message">Status breakdown unavailable.</p><Button variant="secondary" onClick={onRetry}>Retry</Button></div> : total === 0 ? <p className="chart-message">No applications {range === 'all' ? 'yet' : 'this year'}. Add a job to see your pipeline.</p> : <div className="status-chart max-[760px]:grid-cols-1"><div className="recharts-pie-wrap max-[760px]:h-[220px]" role="img" aria-label={`Status breakdown ${range === 'all' ? 'for all time' : 'this year'}: ${values.map(({ status, count }) => `${status} ${count}`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={populatedValues} dataKey="count" nameKey="status" innerRadius="64%" outerRadius="91%" paddingAngle={3} stroke="var(--surface)" strokeWidth={3} isAnimationActive>{populatedValues.map((entry) => <Cell key={entry.status} fill={entry.color}/>)}</Pie><Tooltip shared={false} content={<ChartTooltip/>} wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }}/></PieChart></ResponsiveContainer><div className="donut-center"><small>{range === 'all' ? 'ALL TIME' : 'THIS YEAR'}</small><strong>{total}</strong><span>tracked</span></div></div><div className="status-legend">{values.map(({ status, count, percent, color }) => <div className="status-legend-item" key={status}><span className="status-dot" style={{ backgroundColor: color }}/><span>{status}</span><strong>{count} <small>({percent}%)</small></strong><span className="status-legend-track"><i style={{ width: `${percent}%`, backgroundColor: color }}/></span></div>)}</div></div>}
  </section>;
}

function MonthlyChart({ applications, loading, error, onRetry, range, onRangeChange }) {
  const now = new Date();
  const visibleApplications = getRangeData(applications, range);
  const months = Array.from({ length: range }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - range + 1 + index, 1));
    const count = visibleApplications.filter((application) => {
      const appliedAt = new Date(application.applicationDate);
      return appliedAt.getUTCFullYear() === date.getUTCFullYear() && appliedAt.getUTCMonth() === date.getUTCMonth();
    }).length;
    return { label: date.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }), count };
  });
  const total = months.reduce((sum, month) => sum + month.count, 0);
  return <section className="chart-card" aria-label="Applications created by month">
    <header><div><p className="eyebrow">ACTIVITY</p><h2>Applications over time</h2></div><div className="chart-header-actions"><span className="chart-total">{total} in range</span><ChartRangeSelect range={range} onRangeChange={onRangeChange} label="applications over time"/></div></header>
    {loading ? <LoadingState message="Loading activity…"/> : error ? <div><p className="chart-message">Application history unavailable.</p><Button variant="secondary" onClick={onRetry}>Retry</Button></div> : total === 0 ? <p className="chart-message">No applications in this period yet. Add a job to see activity.</p> : <div className="monthly-chart" role="img" aria-label={`Applications created in the last ${range} months: ${months.map((month) => `${month.label} ${month.count}`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={months} margin={{ top: 12, right: 10, bottom: 0, left: -18 }}><defs><linearGradient id="applicationBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff9b5d"/><stop offset="100%" stopColor="#f36e3d"/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5"/><XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} domain={[0, 'dataMax']} width={34} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip shared={false} cursor={{ fill: 'var(--surface-muted)', opacity: .7 }} content={<ChartTooltip/>} wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }}/><Bar dataKey="count" name="Applications" fill="url(#applicationBarGradient)" radius={[7, 7, 2, 2]} activeBar={{ fill: '#e7672d' }} maxBarSize={range === 6 ? 38 : 26}/></BarChart></ResponsiveContainer></div>}
  </section>;
}

export function AssetsPage({ onBoard }) {
  return <section className="page-content"><div className="page-heading"><div><p className="eyebrow">JOB SEARCH MATERIALS</p><h1>Assets</h1><p>A place for the resources that support your job applications.</p></div></div><div className="feature-empty"><span className="feature-icon"><Icon name="assets" size={22}/></span><h2>What you’ll use Assets for</h2><p>Keep your resume, cover letters, portfolio links, and other job-search materials organized alongside your applications. This page currently explains the feature; saving or uploading files isn’t available yet.</p><Button variant="secondary" onClick={onBoard}>Go to board</Button></div></section>;
}

export function ApplicationDetails({ application, onClose, onEdit }) {
  const date = new Date(application.applicationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  return <Modal className="application-modal application-details-modal" labelledBy="application-details-title" onClose={onClose}>
    <div className="application-details-content">
      <div className="modal-heading"><div><p className="eyebrow">JOB APPLICATION</p><h2 id="application-details-title">{application.companyName}</h2><p className="details-job-title">{application.jobTitle}</p></div><button className="modal-close" type="button" aria-label="Close details" title="Close" onClick={onClose}><Icon name="close" size={16}/></button></div>
      <div className="application-details-grid">
        <div className="application-detail"><span>Status</span><strong className={`details-status details-status-${application.status.toLowerCase()}`}>{application.status === 'Interview' ? 'Interviewing' : application.status}</strong></div>
        <div className="application-detail"><span>Application date</span><strong>{date}</strong></div>
        {application.salary && <div className="application-detail"><span>Salary</span><strong>{application.salary}</strong></div>}
        {application.location && <div className="application-detail"><span>Location</span><strong>{application.location}</strong></div>}
      </div>
      <section className="application-details-notes"><h3>Notes</h3><p>{application.notes?.trim() || 'No notes added.'}</p></section>
    </div>
    <div className="form-actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit(application)}><Icon name="pencil" size={15}/> Edit application</Button></div>
  </Modal>;
}

export function SettingsPage({ workspace, onWorkspaceChange, dailyGoal, onDailyGoalChange }) {
  const [dailyGoalDraft, setDailyGoalDraft] = useState(String(dailyGoal));
  const [dailyGoalError, setDailyGoalError] = useState('');
  useEffect(() => { setDailyGoalDraft(String(dailyGoal)); }, [dailyGoal]);
  const handleDailyGoalChange = (event) => {
    const value = event.target.value;
    setDailyGoalDraft(value);
    if (value === '') {
      setDailyGoalError('');
      return;
    }
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 100) {
      onDailyGoalChange(parsed);
      setDailyGoalError('');
    } else {
      setDailyGoalError('Enter a whole number from 1 to 100.');
    }
  };
  return <section className="page-content settings-page"><div className="page-heading"><div><p className="eyebrow">PREFERENCES</p><h1>Settings</h1><p>Personalize your job-tracking workspace.</p></div></div>
    <section className="settings-card"><h2>Workspace</h2><label className="settings-field">Workspace title<input value={workspace} maxLength={50} onChange={(event) => onWorkspaceChange(event.target.value || 'Job Tracker')}/></label></section>
    <section className="settings-card"><h2>Daily goal</h2><label className="settings-field">Applications per day<input type="number" min="1" max="100" step="1" value={dailyGoalDraft} aria-invalid={Boolean(dailyGoalError)} aria-describedby="daily-goal-help" onChange={handleDailyGoalChange}/><small id="daily-goal-help">{dailyGoalError || 'Counts applications created today using UTC. Your goal is saved in this browser.'}</small></label></section>
  </section>;
}

export function ApplicationList({ applications, loading, error, onRetry, onSelect, onEdit, onStatusChange, onDelete, pendingIds }) {
  if (loading) return <LoadingState message="Loading applications…"/>;
  if (error) return <ErrorMessage message={error} onRetry={onRetry}/>;
  return <div className="application-table-wrap"><table className="application-table"><thead><tr><th>Company</th><th>Job title</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead><tbody>{applications.map((item) => <tr key={item._id}><td><button className="table-link" onClick={() => onSelect(item)}>{item.companyName}</button></td><td>{item.jobTitle}</td><td>{new Date(item.applicationDate).toLocaleDateString()}</td><td><select aria-label={`Change status for ${item.companyName}`} value={item.status} disabled={pendingIds.has(item._id)} onChange={(event) => onStatusChange(item, event.target.value)}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></td><td><button className="table-action" onClick={() => onEdit(item)}>Edit</button><button className="table-action danger" onClick={() => onDelete(item)}>Delete</button></td></tr>)}</tbody></table>{!applications.length && <div className="table-empty">No applications match your current filters.</div>}</div>;
}

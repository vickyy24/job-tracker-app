import { useEffect, useState } from 'react';
import { Button, ErrorMessage, LoadingState, Modal } from './UI';
import Icon from './Icon';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const STATUS_GRADIENTS = { Applied: 'url(#statusAppliedGradient)', Interview: 'url(#statusInterviewGradient)', Offer: 'url(#statusOfferGradient)', Rejected: 'url(#statusRejectedGradient)' };
const STATUS_SWATCHES = {
  Applied: 'linear-gradient(135deg, #c2410c, #f97316)',
  Interview: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
  Offer: 'linear-gradient(135deg, #047857, #34d399)',
  Rejected: 'linear-gradient(135deg, #be123c, #fb7185)',
};
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
  if (item.payload?.status) return <div className="chart-tooltip"><strong>{title}</strong><span><b className="chart-tooltip-metric">{count} {count === 1 ? 'application' : 'applications'}</b> · <em className="chart-tooltip-percent">{item.payload.percent}%</em></span></div>;
  if (item.dataKey !== 'count') return null;
  return <div className="chart-tooltip"><strong>{title}</strong><span>{count} {count === 1 ? 'application' : 'applications'}</span></div>;
}

export function Overview({ stats, loading, error, onRetry, applications, chartApplications, loadingChartApplications, chartApplicationsError, onRetryChartApplications, loadingApplications, applicationsError, onRetryApplications, onSelectApplication, onEditApplication, onStatusChange, onDeleteApplication, pendingIds, search, onSearchChange, status, onStatusFilter, sortBy, onSortByChange, order, onOrderChange, onClearFilters, onOpenBoard, onAdd }) {
  const [activityPeriod, setActivityPeriod] = useState('monthly');
  return <section className="page-content dashboard-page max-[1100px]:[&_.stats-grid]:grid-cols-3 max-[760px]:[&_.stats-grid]:grid-cols-2 max-[760px]:[&_.stat-card]:min-h-[68px] max-[760px]:[&_.stat-card]:p-[10px]">
    <div className="page-heading"><div><p className="eyebrow">YOUR OVERVIEW</p><h1>Dashboard</h1><p>Track your pipeline and keep the next step in view.</p></div><Button variant="secondary" onClick={onOpenBoard}>Open board</Button></div>
    <StatsGrid stats={stats} loading={loading} error={error} onRetry={onRetry}/>
    <div className="dashboard-insights"><StatusChart applications={chartApplications} loading={loadingChartApplications} error={chartApplicationsError} onRetry={onRetryChartApplications} selectedStatus={status} onStatusFilter={onStatusFilter}/><MonthlyChart applications={chartApplications} loading={loadingChartApplications} error={chartApplicationsError} onRetry={onRetryChartApplications} period={activityPeriod} onPeriodChange={setActivityPeriod}/></div>
    <section className="overview-recent"><header><div><p className="eyebrow">APPLICATIONS</p><h2>All applications</h2></div><Button onClick={onAdd}><span className="plus-icon">+</span> Add job</Button></header>
      <div className="dashboard-filters max-[760px]:flex-wrap" aria-label="Filter and sort applications"><label className="search-control max-[760px]:flex-[1_1_100%]"><Icon name="search" size={16}/><input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search company or job title…" aria-label="Search by company or job title"/></label><select className="status-filter max-[760px]:flex-1" value={status} onChange={(event) => onStatusFilter(event.target.value)} aria-label="Filter applications by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><label className="sort-control max-[760px]:flex-1"><span>Sort by</span><select value={sortBy} onChange={(event) => onSortByChange(event.target.value)} aria-label="Sort applications by"><option value="applicationDate">Application date</option><option value="createdAt">Created date</option><option value="companyName">Company name</option><option value="jobTitle">Job title</option></select></label><select className="direction-select max-[760px]:flex-1" value={order} onChange={(event) => onOrderChange(event.target.value)} aria-label="Sort direction"><option value="desc">Descending</option><option value="asc">Ascending</option></select>{Boolean(search.trim() || status) && <button className="clear-filters-button" onClick={onClearFilters}>Clear filters</button>}</div>
      <ApplicationList applications={applications} loading={loadingApplications} error={applicationsError} onRetry={onRetryApplications} onSelect={onSelectApplication} onEdit={onEditApplication} onStatusChange={onStatusChange} onDelete={onDeleteApplication} pendingIds={pendingIds}/>
    </section>
  </section>;
}

export function StatsGrid({ stats, loading, error, onRetry }) {
  return <><div className="stats-grid">{STAT_CARDS.map((card) => <article className={`stat-card stat-card-${card.tone}`} key={card.key}><div className="stat-card-heading"><span className="stat-label">{card.label}</span><span className="stat-icon"><Icon name={card.icon} size={21}/></span></div><p className="stat-value">{loading || error ? '—' : metricValue(stats, card.key)}</p></article>)}</div>{error && <ErrorMessage message={error} onRetry={onRetry}/>}</>;
}

const ACTIVITY_PERIODS = {
  daily: { label: 'Daily · last 7 days', buckets: 7, unit: 'day' },
  weekly: { label: 'Weekly · last 8 weeks', buckets: 8, unit: 'week' },
  monthly: { label: 'Monthly · last 6 months', buckets: 6, unit: 'month' },
};
function StatusFilterSelect({ status, onStatusFilter }) {
  return <select className="chart-period-select" value={status || ''} onChange={(event) => onStatusFilter(event.target.value)} aria-label="Filter applications by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{item === 'Interview' ? 'Interviewing' : item}</option>)}</select>;
}

function ActivityPeriodSelect({ period, onPeriodChange }) {
  return <select className="chart-period-select" value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Group application activity by time period"><option value="daily">Daily · last 7 days</option><option value="weekly">Weekly · last 8 weeks</option><option value="monthly">Monthly · last 6 months</option></select>;
}

function getActivityBuckets(applications = [], period) {
  const config = ACTIVITY_PERIODS[period] || ACTIVITY_PERIODS.monthly;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: config.buckets }, (_, index) => {
    const offset = index - config.buckets + 1;
    let start;
    let end;
    if (config.unit === 'day') {
      start = new Date(today);
      start.setUTCDate(today.getUTCDate() + offset);
      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 1);
    } else if (config.unit === 'week') {
      const currentMonday = new Date(today);
      currentMonday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
      start = new Date(currentMonday);
      start.setUTCDate(currentMonday.getUTCDate() + offset * 7);
      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 7);
    } else {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
      end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    }
    const count = applications.filter((application) => {
      const date = new Date(application.applicationDate);
      return !Number.isNaN(date.getTime()) && date >= start && date < end;
    }).length;
    const label = config.unit === 'day'
      ? start.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
      : config.unit === 'week'
        ? `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
        : start.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' });
    return { label, count };
  });
}

function StatusChart({ applications, loading, error, onRetry, selectedStatus, onStatusFilter }) {
  const visibleApplications = applications || [];
  const counts = visibleApplications.reduce((result, application) => {
    if (STATUSES.includes(application.status)) result[application.status] += 1;
    return result;
  }, Object.fromEntries(STATUSES.map((status) => [status, 0])));
  const total = visibleApplications.length;
  const values = STATUSES.map((key) => {
    const count = Number(counts[key]) || 0;
    return { key, status: key === 'Interview' ? 'Interviewing' : key, count, percent: total ? Math.round(count / total * 100) : 0 };
  });
  const populatedValues = values.filter((entry) => entry.count > 0);
  return <section className="chart-card" aria-label="Applications by status">
    <header><div><p className="eyebrow">PIPELINE</p><h2>Status breakdown</h2></div><div className="chart-header-actions"><span className="chart-total">{selectedStatus ? `${counts[selectedStatus] || 0} ${selectedStatus === 'Interview' ? 'interviewing' : selectedStatus.toLowerCase()}` : `${total} total`}</span><StatusFilterSelect status={selectedStatus} onStatusFilter={onStatusFilter}/></div></header>
    {loading ? <LoadingState message="Loading status totals…"/> : error ? <div><p className="chart-message">Status breakdown unavailable.</p><Button variant="secondary" onClick={onRetry}>Retry</Button></div> : total === 0 ? <p className="chart-message">No applications yet. Add a job to see your pipeline.</p> : <div className="status-chart max-[760px]:grid-cols-1"><div className="recharts-pie-wrap" role="img" aria-label={`Status breakdown: ${values.map(({ status, count, percent }) => `${status} ${count} (${percent}%)`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><PieChart><defs>
      <linearGradient id="statusAppliedGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#9a3412"/><stop offset="100%" stopColor="#f97316"/></linearGradient>
      <linearGradient id="statusInterviewGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#1e3a8a"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient>
      <linearGradient id="statusOfferGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#065f46"/><stop offset="100%" stopColor="#34d399"/></linearGradient>
      <linearGradient id="statusRejectedGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#881337"/><stop offset="100%" stopColor="#fb7185"/></linearGradient>
    </defs><Pie data={populatedValues} dataKey="count" nameKey="status" innerRadius="49%" outerRadius="79%" paddingAngle={2} stroke="var(--surface)" strokeWidth={3} isAnimationActive={false} label={{ position: 'inside', dataKey: 'percent', formatter: (percent) => `${percent}%`, fill: '#fff', fontSize: 10, fontWeight: 700 }} labelLine={false} onClick={(entry) => { const key = entry?.payload?.key; if (key) onStatusFilter(selectedStatus === key ? '' : key); }}>{populatedValues.map((entry) => <Cell key={entry.key} fill={STATUS_GRADIENTS[entry.key]} fillOpacity={selectedStatus && selectedStatus !== entry.key ? .38 : 1}/>)}</Pie><Tooltip shared={false} content={<ChartTooltip/>} wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }}/></PieChart></ResponsiveContainer><div className="donut-center"><small>{selectedStatus ? `${selectedStatus === 'Interview' ? 'INTERVIEWING' : selectedStatus.toUpperCase()} SELECTED` : 'ALL STATUSES'}</small><strong>{selectedStatus ? counts[selectedStatus] || 0 : total}</strong><span>{selectedStatus ? 'applications' : 'tracked'}</span></div></div><div className="status-legend">{values.map(({ key, status: itemStatus, count, percent }) => <button type="button" className={`status-legend-item status-legend-filter${selectedStatus && selectedStatus !== key ? ' is-muted' : ''}`} key={key} onClick={() => onStatusFilter(selectedStatus === key ? '' : key)} aria-pressed={selectedStatus === key}><span className="status-dot" style={{ background: STATUS_SWATCHES[key] }}/><span>{itemStatus}</span><strong>{count} <small>({percent}%)</small></strong><span className="status-legend-track"><i style={{ width: `${percent}%`, background: STATUS_SWATCHES[key] }}/></span></button>)}</div></div>}
  </section>;
}

function MonthlyChart({ applications, loading, error, onRetry, period, onPeriodChange }) {
  const buckets = getActivityBuckets(applications || [], period);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const config = ACTIVITY_PERIODS[period] || ACTIVITY_PERIODS.monthly;
  return <section className="chart-card" aria-label="Applications created by month">
    <header><div><p className="eyebrow">ACTIVITY</p><h2>Applications over time</h2></div><div className="chart-header-actions"><span className="chart-total">{total} in range</span><ActivityPeriodSelect period={period} onPeriodChange={onPeriodChange}/></div></header>
    {loading ? <LoadingState message="Loading activity…"/> : error ? <div><p className="chart-message">Application history unavailable.</p><Button variant="secondary" onClick={onRetry}>Retry</Button></div> : total === 0 ? <p className="chart-message">No applications in this period yet. Add a job to see activity.</p> : <div className="monthly-chart" role="img" aria-label={`Applications grouped ${config.unit} for the selected period: ${buckets.map((bucket) => `${bucket.label} ${bucket.count}`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={buckets} margin={{ top: 20, right: 10, bottom: 0, left: -18 }}><defs><linearGradient id="applicationBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff9b5d"/><stop offset="100%" stopColor="#f36e3d"/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5"/><XAxis dataKey="label" interval={period === 'weekly' ? 1 : 0} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} width={34} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip shared={false} cursor={{ fill: 'var(--surface-muted)', opacity: .7 }} content={<ChartTooltip/>} wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }}/><Bar dataKey="count" name="Applications" fill="url(#applicationBarGradient)" radius={[7, 7, 2, 2]} activeBar={{ fill: '#e7672d' }} maxBarSize={period === 'monthly' ? 38 : 28} isAnimationActive={false}><LabelList dataKey="count" position="top" fill="var(--text)" fontSize={11} fontWeight={600}/></Bar></BarChart></ResponsiveContainer></div>}
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

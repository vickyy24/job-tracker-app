import { useState } from 'react';
import { Button, ErrorMessage, LoadingState } from '../components/shared';
import Icon from '../components/Icon';
import { ApplicationList } from '../components/ApplicationList';
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
    const title = item.payload?.status || label || 'Selected period';
    const count = Number(item.value) || 0;
    if (item.payload?.status) return <div className="chart-tooltip"><strong>{title}</strong><span><b className="chart-tooltip-metric">{count} {count === 1 ? 'application' : 'applications'}</b> · <em className="chart-tooltip-percent">{item.payload.percent}%</em></span></div>;
    if (item.dataKey !== 'count') return null;
    return <div className="chart-tooltip"><strong>{title}</strong><span>{count} {count === 1 ? 'application' : 'applications'}</span></div>;
}

export default function DashboardPage({ stats, loading, error, onRetry, applications, chartApplications, loadingChartApplications, chartApplicationsError, onRetryChartApplications, loadingApplications, applicationsError, onRetryApplications, onSelectApplication, onEditApplication, search, onSearchChange, status, onStatusFilter, sortBy, onSortByChange, onClearFilters, onOpenBoard, onAdd }) {
    const [activityPeriod, setActivityPeriod] = useState('weekly');
    return <section className="page-content dashboard-page min-w-0">
        <div className="page-heading flex items-center justify-between -mt-[12px] mb-[18px] max-[480px]:items-start max-[480px]:gap-2"><div><h1 className="max-[480px]:text-[22px]">Dashboard</h1><p className="max-[480px]:[--page-heading-description-size:11px]">Track your pipeline and keep the next step in view.</p></div><Button className="max-[390px]:px-2 max-[390px]:text-[10px] max-[480px]:min-h-[34px] max-[480px]:whitespace-nowrap" variant="secondary" onClick={onOpenBoard}>Open board</Button></div>
        <StatsGrid stats={stats} loading={loading} error={error} onRetry={onRetry} />
        <div className="dashboard-insights grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-4 mb-3 max-[1100px]:grid-cols-1"><StatusChart applications={chartApplications} loading={loadingChartApplications} error={chartApplicationsError} onRetry={onRetryChartApplications} selectedStatus={status} onStatusFilter={onStatusFilter} /><MonthlyChart applications={chartApplications} loading={loadingChartApplications} error={chartApplicationsError} onRetry={onRetryChartApplications} period={activityPeriod} onPeriodChange={setActivityPeriod} /></div>
        <section className="overview-recent max-[480px]:p-[14px]"><header className="flex items-center justify-between gap-2 mb-[10px] max-[480px]:items-center"><div><p className="eyebrow">APPLICATIONS</p><h2>All applications</h2></div><Button className="max-[480px]:min-h-[30px] max-[480px]:whitespace-nowrap max-[480px]:px-[9px] max-[480px]:text-[10px]" onClick={onAdd}><span className="plus-icon">+</span> Add job</Button></header>
            <div className="dashboard-filters flex items-center gap-[9px] mb-3 max-[760px]:flex-wrap max-[480px]:[--dashboard-filters-display:grid] max-[480px]:grid-cols-2 max-[480px]:items-center max-[480px]:gap-[5px] max-[480px]:relative" aria-label="Filter and sort applications"><label className="search-control max-[760px]:flex-[1_1_100%] max-[480px]:col-span-2 max-[480px]:h-[30px] max-[480px]:w-full max-[480px]:min-w-0 max-[480px]:gap-1 max-[480px]:px-[6px]"><Icon className="max-[480px]:size-3 max-[480px]:min-w-3" name="search" size={16} /><input className="max-[480px]:min-w-0 max-[480px]:text-[9px]" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search company or job title…" aria-label="Search by company or job title" /></label><select className="status-filter max-[760px]:flex-1 max-[480px]:h-[30px] max-[480px]:w-full max-[480px]:min-w-0 max-[480px]:[--status-filter-min-width:0px] max-[480px]:px-[5px] max-[480px]:text-[9px]" value={status} onChange={(event) => onStatusFilter(event.target.value)} aria-label="Filter applications by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><label className="sort-control dashboard-sort-control max-[760px]:flex-1 max-[480px]:h-[30px] max-[480px]:w-full max-[480px]:min-w-0 max-[480px]:[--dashboard-sort-min-width:0px] max-[480px]:gap-0 max-[480px]:pr-1"><span>Sort by</span><Icon className="sort-control-chevron" name="down" size={14} /><select value={sortBy} onChange={(event) => onSortByChange(event.target.value)} aria-label="Sort applications by"><option value="applicationDate">Application date</option><option value="createdAt">Created date</option><option value="companyName">Company name</option><option value="jobTitle">Job title</option></select></label>{Boolean(search.trim() || status) && <button className="clear-filters-button max-[480px]:absolute max-[480px]:top-[calc(100%+1px)] max-[480px]:right-0 max-[480px]:px-1 max-[480px]:py-[2px] max-[480px]:text-[9px]" onClick={onClearFilters}>Clear filters</button>}</div>
            <ApplicationList applications={applications} loading={loadingApplications} error={applicationsError} onRetry={onRetryApplications} onSelect={onSelectApplication} onEdit={onEditApplication} />
        </section>
    </section>;
}

function StatsGrid({ stats, loading, error, onRetry }) {
    return <><div className="stats-grid mx-auto grid w-full grid-cols-4 gap-[10px] mb-3 max-[1100px]:grid-cols-3 max-[1100px]:gap-2 max-[760px]:grid-cols-2 max-[390px]:gap-[7px]">{STAT_CARDS.map((card) => <div className="max-[480px]:rounded-[14px] max-[480px]:border max-[480px]:border-[var(--border)] max-[480px]:bg-[var(--canvas)] max-[480px]:px-1 max-[480px]:py-0" key={card.key}><article className={`stat-card stat-card-${card.tone} max-[760px]:min-h-[68px] max-[760px]:p-[10px]`}><div className="stat-card-heading"><span className="stat-label max-[390px]:text-[11px]">{card.label}</span><span className="stat-icon"><Icon name={card.icon} size={21} /></span></div><p className="stat-value">{loading || error ? '—' : metricValue(stats, card.key)}</p></article></div>)}</div>{error && <ErrorMessage message={error} onRetry={onRetry} />}</>;
}

const ACTIVITY_PERIODS = {
    weekly: { label: 'Weekly', buckets: 8, unit: 'week' },
    monthly: { label: 'Monthly', buckets: 12, unit: 'month' },
    yearly: { label: 'Yearly', buckets: 5, unit: 'year' },
};
function StatusFilterSelect({ status, onStatusFilter }) {
    return <select className="chart-period-select" value={status || ''} onChange={(event) => onStatusFilter(event.target.value)} aria-label="Filter applications by status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{item === 'Interview' ? 'Interviewing' : item}</option>)}</select>;
}

function ActivityPeriodSelect({ period, onPeriodChange }) {
    return <select className="chart-period-select" value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Group application activity by time period"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>;
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
        } else if (config.unit === 'month') {
            start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
            end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
        } else {
            start = new Date(Date.UTC(now.getUTCFullYear() + offset, 0, 1));
            end = new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
        }
        const count = applications.filter((application) => {
            const date = new Date(application.applicationDate);
            return !Number.isNaN(date.getTime()) && date >= start && date < end;
        }).length;
        const label = config.unit === 'day'
            ? start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
            : config.unit === 'week'
                ? `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
                : config.unit === 'month'
                    ? start.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
                    : String(start.getUTCFullYear());
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
    return <section className="chart-card flex min-w-0 h-full flex-col p-3 max-[1100px]:min-h-0 max-[760px]:min-h-[205px] max-[760px]:p-[15px] max-[480px]:p-[14px] max-[480px]:[--chart-title-size:12px] max-[480px]:[--chart-filter-height:30px] max-[480px]:[--chart-filter-padding:0_20px_0_7px] max-[480px]:[--chart-filter-font-size:10px] max-[480px]:[--chart-total-padding:4px_7px] max-[480px]:[--chart-total-font-size:9px]" aria-label="Applications by status">
        <header className="flex items-center justify-between gap-2 mb-[5px] max-[480px]:gap-1 max-[480px]:flex-nowrap"><div className="min-w-0"><p className="eyebrow">PIPELINE</p><h2 className="whitespace-nowrap">Status breakdown</h2></div><div className="chart-header-actions flex items-center gap-[9px] max-[480px]:flex-nowrap max-[480px]:gap-1"><span className="chart-total">{selectedStatus ? `${counts[selectedStatus] || 0} ${selectedStatus === 'Interview' ? 'interviewing' : selectedStatus.toLowerCase()}` : `${total} total`}</span><StatusFilterSelect status={selectedStatus} onStatusFilter={onStatusFilter} /></div></header>
        {loading ? <LoadingState message="Loading status totals…" /> : error ? <div><p className="chart-message">Status breakdown unavailable.</p><Button variant="secondary" onClick={onRetry}>Retry</Button></div> : total === 0 ? <p className="chart-message">No applications yet. Add a job to see your pipeline.</p> : <div className="status-chart grid grid-cols-[minmax(150px,1fr)_minmax(145px,.95fr)] items-center gap-[10px] min-h-[270px] max-[760px]:grid-cols-1 max-[760px]:gap-1"><div className="recharts-pie-wrap max-[760px]:size-[260px] max-[480px]:size-[250px]" role="img" aria-label={`Status breakdown: ${values.map(({ status, count, percent }) => `${status} ${count} (${percent}%)`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><PieChart><defs>
            <linearGradient id="statusAppliedGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#9a3412" /><stop offset="100%" stopColor="#f97316" /></linearGradient>
            <linearGradient id="statusInterviewGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#1e3a8a" /><stop offset="100%" stopColor="#60a5fa" /></linearGradient>
            <linearGradient id="statusOfferGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#065f46" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
            <linearGradient id="statusRejectedGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#881337" /><stop offset="100%" stopColor="#fb7185" /></linearGradient>
        </defs><Pie data={populatedValues} dataKey="count" nameKey="status" innerRadius="49%" outerRadius="79%" paddingAngle={2} stroke="var(--surface)" strokeWidth={3} isAnimationActive={false} label={{ position: 'inside', dataKey: 'percent', formatter: (percent) => `${percent}%`, fill: '#fff', fontSize: 10, fontWeight: 700 }} labelLine={false} onClick={(entry) => { const key = entry?.payload?.key; if (key) onStatusFilter(selectedStatus === key ? '' : key); }}>{populatedValues.map((entry) => <Cell key={entry.key} fill={STATUS_GRADIENTS[entry.key]} fillOpacity={selectedStatus && selectedStatus !== entry.key ? .38 : 1} />)}</Pie><Tooltip shared={false} content={<ChartTooltip />} wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }} /></PieChart></ResponsiveContainer><div className="donut-center"><small>{selectedStatus ? `${selectedStatus === 'Interview' ? 'INTERVIEWING' : selectedStatus.toUpperCase()} SELECTED` : 'ALL STATUSES'}</small><strong>{selectedStatus ? counts[selectedStatus] || 0 : total}</strong><span>{selectedStatus ? 'applications' : 'tracked'}</span></div></div><div className="status-legend grid gap-[13px] max-[760px]:grid-cols-2 max-[760px]:gap-3">{values.map(({ key, status: itemStatus, count, percent }) => <button type="button" className={`status-legend-item status-legend-filter grid grid-cols-[9px_1fr_auto] items-center gap-x-2 gap-y-[7px]${selectedStatus && selectedStatus !== key ? ' is-muted' : ''}`} key={key} onClick={() => onStatusFilter(selectedStatus === key ? '' : key)} aria-pressed={selectedStatus === key}><span className="status-dot" style={{ background: STATUS_SWATCHES[key] }} /><span>{itemStatus}</span><strong>{count} <small>({percent}%)</small></strong><span className="status-legend-track"><i style={{ width: `${percent}%`, background: STATUS_SWATCHES[key] }} /></span></button>)}</div></div>}
    </section>;
}

function MonthlyChart({ applications, loading, error, onRetry, period, onPeriodChange }) {
    const buckets = getActivityBuckets(applications || [], period);
    const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    const config = ACTIVITY_PERIODS[period] || ACTIVITY_PERIODS.monthly;
    return <section className="chart-card flex min-w-0 h-full flex-col p-3 max-[1100px]:min-h-0 max-[760px]:min-h-[205px] max-[760px]:p-[15px] max-[480px]:p-[14px] max-[480px]:[--chart-title-size:12px] max-[480px]:[--chart-filter-height:30px] max-[480px]:[--chart-filter-padding:0_20px_0_7px] max-[480px]:[--chart-filter-font-size:10px] max-[480px]:[--chart-total-padding:4px_7px] max-[480px]:[--chart-total-font-size:9px]" aria-label="Application activity over time">
        <header className="flex items-center justify-between gap-2 mb-[5px] max-[480px]:gap-1 max-[480px]:flex-nowrap"><div className="min-w-0"><p className="eyebrow">ACTIVITY</p><h2 className="whitespace-nowrap">Applications over time</h2></div><div className="chart-header-actions flex items-center gap-[9px] max-[480px]:flex-nowrap max-[480px]:gap-1"><span className="chart-total">{total} in range</span><ActivityPeriodSelect period={period} onPeriodChange={onPeriodChange} /></div></header>
        {loading ? <LoadingState message="Loading activity…" /> : error ? <div><p className="chart-message">Application history unavailable.</p><Button variant="secondary" onClick={onRetry}>Retry</Button></div> : total === 0 ? <p className="chart-message">No applications in this period yet. Add a job to see activity.</p> : <div className="monthly-chart" role="img" aria-label={`Applications grouped ${config.unit} for the selected period: ${buckets.map((bucket) => `${bucket.label} ${bucket.count}`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={buckets} margin={{ top: 20, right: 10, bottom: 0, left: -18 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" /><XAxis dataKey="label" interval={period === 'weekly' ? 1 : 0} tick={{ fill: 'var(--muted)', fontSize: period === 'weekly' ? 9 : 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} width={34} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip shared={false} cursor={{ fill: 'var(--surface-muted)', opacity: .7 }} content={<ChartTooltip />} wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }} /><Bar dataKey="count" name="Applications" fill="#0f8883" radius={[7, 7, 2, 2]} activeBar={{ fill: '#0f8883', stroke: 'none', strokeWidth: 0 }} maxBarSize={period === 'monthly' || period === 'yearly' ? 38 : 28} isAnimationActive={false}><LabelList dataKey="count" position="top" fill="var(--text)" fontSize={11} fontWeight={600} /></Bar></BarChart></ResponsiveContainer></div>}
    </section>;
}


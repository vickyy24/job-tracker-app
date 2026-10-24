export default function StatusBadge({ status, className = '' }) {
    const statusClass = {
        Applied: 'applied',
        Interview: 'interview',
        Offer: 'offer',
        Rejected: 'rejected',
    }[status] || 'default';

    return <span className={`status-badge status-badge-${statusClass} ${className}`.trim()}>{status}</span>;
}

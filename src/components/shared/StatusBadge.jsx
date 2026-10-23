export default function StatusBadge({ status }) {
  const statusClass = {
    Applied: 'applied',
    Interview: 'interview',
    Offer: 'offer',
    Rejected: 'rejected',
  }[status] || 'default';

  return <span className={`status-badge status-badge-${statusClass}`}>{status}</span>;
}

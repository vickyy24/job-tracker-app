import './ui.css';

export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      className={`ui-button ui-button-${variant} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextInput({ id, label, error, ...props }) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <span className="ui-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

export function SelectInput({ id, label, error, children, ...props }) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}>
        {children}
      </select>
      {error && <span className="ui-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const statusClass = {
    Applied: 'applied',
    Interview: 'interview',
    Offer: 'offer',
    Rejected: 'rejected',
  }[status] || 'default';

  return <span className={`status-badge status-badge-${statusClass}`}>{status}</span>;
}

export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="ui-loading" role="status" aria-live="polite">
      <span className="ui-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="ui-empty">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="ui-error" role="alert">
      <p>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

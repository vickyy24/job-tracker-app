import Button from './Button';

export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="ui-loading" role="status" aria-live="polite">
      <span className="ui-spinner animate-spin motion-reduce:animate-none" aria-hidden="true" />
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

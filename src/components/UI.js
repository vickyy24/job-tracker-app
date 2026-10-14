import { useEffect, useRef } from 'react';
import './ui.css';

export function Modal({ children, className, role = 'dialog', labelledBy, describedBy, onClose, closeDisabled = false }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
    focusable()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabledRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0].focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector('[data-dialog-focus-fallback]')?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !closeDisabled) onCloseRef.current(); }}>
      <section
        ref={dialogRef}
        className={className}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex="-1"
      >
        {children}
      </section>
    </div>
  );
}

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

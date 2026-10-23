export default function TextInput({ id, label, error, ...props }) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <span className="ui-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

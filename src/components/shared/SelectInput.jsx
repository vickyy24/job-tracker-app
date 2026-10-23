export default function SelectInput({ id, label, error, children, ...props }) {
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

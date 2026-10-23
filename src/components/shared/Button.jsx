export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button className={`ui-button ui-button-${variant} ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  );
}

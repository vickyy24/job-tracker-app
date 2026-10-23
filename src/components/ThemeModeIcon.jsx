export default function ThemeModeIcon({ mode }) {
  if (mode === 'sun') {
    return (
      <svg className="theme-mode-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="5.1" fill="currentColor" />
        <g fill="currentColor">
          <rect x="10.9" y="1" width="2.2" height="4" rx="1.1" />
          <rect x="10.9" y="19" width="2.2" height="4" rx="1.1" />
          <rect x="1" y="10.9" width="4" height="2.2" rx="1.1" />
          <rect x="19" y="10.9" width="4" height="2.2" rx="1.1" />
          <rect x="4.1" y="4.1" width="2.2" height="4" rx="1.1" transform="rotate(-45 5.2 6.1)" />
          <rect x="17.7" y="15.9" width="2.2" height="4" rx="1.1" transform="rotate(-45 18.8 17.9)" />
          <rect x="15.9" y="4.1" width="2.2" height="4" rx="1.1" transform="rotate(45 17 6.1)" />
          <rect x="2.3" y="15.9" width="2.2" height="4" rx="1.1" transform="rotate(45 3.4 17.9)" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="theme-mode-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.2 15.1A8.6 8.6 0 0 1 8.9 3.8 8.8 8.8 0 1 0 20.2 15.1Z" fill="currentColor" />
      <path d="m17.8 3 .45 1.25L19.5 4.7l-1.25.45-.45 1.25-.45-1.25-1.25-.45 1.25-.45L17.8 3Z" fill="currentColor" />
    </svg>
  );
}

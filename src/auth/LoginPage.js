import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

function modeFromPath() {
  return window.location.pathname === '/register' || window.location.pathname === '/sign-up' ? 'register' : 'login';
}

export default function LoginPage() {
  const { authenticate, notice, status, retryRestore } = useAuth();
  const [mode, setMode] = useState(modeFromPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  useEffect(() => {
    const syncMode = () => {
      setMode(modeFromPath());
      setError('');
      setPassword('');
    };
    window.addEventListener('popstate', syncMode);
    return () => window.removeEventListener('popstate', syncMode);
  }, []);

  const changeMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
    window.history.pushState({}, '', next === 'register' ? '/register' : '/login');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (registering && (password.length < 12 || password.length > 128 || !/\S/.test(password))) {
      setError('Use a password between 12 and 128 characters, including at least one non-space character.');
      return;
    }
    setBusy(true);
    try { await authenticate({ email: normalizedEmail, password }, mode); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  return <main className="auth-page">
    <section className="auth-panel" aria-labelledby="auth-title">
      <a className="auth-brand" href="/login" aria-label="Jobtrack home"><span className="auth-brand-mark">J</span><span>job<strong>track</strong></span></a>
      <div className="auth-heading">
        <p className="auth-eyebrow">YOUR PRIVATE JOB SEARCH</p>
        <h1 id="auth-title">{registering ? 'Create your account' : 'Welcome back'}</h1>
        <p>{registering ? 'Keep every application and next step in one private place.' : 'Sign in to continue tracking your applications.'}</p>
      </div>

      {notice && <p className="auth-notice" role="status">{notice}</p>}
      {status === 'unavailable' && <div className="auth-unavailable" role="alert">
        <p>We couldn’t check your session. Check your connection and try again.</p>
        <button type="button" onClick={retryRestore}>Retry</button>
      </div>}

      <form className="auth-form" onSubmit={submit} noValidate>
        <label className="auth-field" htmlFor="auth-email">Email address
          <input id="auth-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck="false" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy}/>
        </label>
        <label className="auth-field" htmlFor="auth-password">Password
          <input id="auth-password" name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 12 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy}/>
        </label>
        {registering && <p className="auth-help">Use 12–128 characters. Your password is never stored in this browser.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">{registering ? 'Already have an account?' : 'New to Jobtrack?'}{' '}
        <button type="button" onClick={() => changeMode(registering ? 'login' : 'register')} disabled={busy}>
          {registering ? 'Sign in' : 'Create an account'}
        </button>
      </p>
      <p className="auth-privacy">Your job search data belongs to your account and is only available after you sign in.</p>
    </section>
  </main>;
}

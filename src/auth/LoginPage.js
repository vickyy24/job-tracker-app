import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

const passwordByteLength = (value) => new TextEncoder().encode(value).length;
const validUsername = (value) => {
  const normalized = value.trim().toLowerCase();
  if (/^[a-z0-9._-]{3,32}$/.test(normalized)) return true;
  if (normalized.length < 6 || normalized.length > 254) return false;
  const [localPart, ...domainParts] = normalized.split('@');
  if (!localPart || localPart.length > 64 || domainParts.length !== 1) return false;
  const domain = domainParts[0];
  return Boolean(domain && domain.length <= 253 && domain.includes('.')
    && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)
    && domain.split('.').every((label) => label.length > 0 && label.length <= 63
      && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)));
};

function modeFromPath() {
  return window.location.pathname === '/register' || window.location.pathname === '/sign-up' ? 'register' : 'login';
}

export default function LoginPage() {
  const { authenticate, notice, status, retryRestore } = useAuth();
  const [mode, setMode] = useState(modeFromPath);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  useEffect(() => {
    const syncMode = () => {
      setMode(modeFromPath());
      setError('');
      setFieldErrors({});
      setPassword('');
      setConfirmPassword('');
      setPasswordVisible(false);
      setConfirmPasswordVisible(false);
    };
    window.addEventListener('popstate', syncMode);
    return () => window.removeEventListener('popstate', syncMode);
  }, []);

  const changeMode = (next) => {
    setMode(next);
    setError('');
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);
    window.history.pushState({}, '', next === 'register' ? '/register' : '/login');
  };

  const validateField = (field) => {
    let message = '';
    if (field === 'username') {
      if (!username.trim()) message = 'Enter a username or email address.';
      else if (!validUsername(username)) message = 'Enter a valid username or email address.';
    } else if (field === 'password') {
      if (!password) message = 'Enter your password.';
      else if (password.length > 128) message = 'Password must be 128 characters or fewer.';
      else if (registering && passwordByteLength(password) > 72) message = 'Password must be no more than 72 bytes when encoded.';
      else if (registering && (Array.from(password).length < 12 || !/\S/.test(password))) message = 'Use 12–128 characters and include at least one non-space character.';
    } else if (field === 'confirmPassword') {
      if (!confirmPassword) message = 'Confirm your password.';
      else if (password !== confirmPassword) message = 'Passwords do not match.';
    }
    setFieldErrors((current) => ({ ...current, [field]: message }));
    return message;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const fields = ['username', 'password', ...(registering ? ['confirmPassword'] : [])];
    const messages = fields.map((field) => [field, validateField(field)]).filter(([, message]) => message);
    if (messages.length) {
      setFieldErrors(Object.fromEntries(messages));
      const inputIds = { username: 'auth-username', password: 'auth-password', confirmPassword: 'auth-confirm-password' };
      document.getElementById(inputIds[messages[0][0]])?.focus();
      return;
    }

    setBusy(true);
    if (!registering) setPasswordVisible(false);
    try {
      await authenticate({ username: username.trim().toLowerCase(), password, confirmPassword, rememberMe }, mode);
    } catch (requestError) {
      setError(requestError.message);
      if (!registering) {
        setPassword('');
        setPasswordVisible(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return <main className={`auth-page ${registering ? 'auth-register-page' : ''}`}>
    <section className="auth-panel" aria-labelledby="auth-title">
      <a className="auth-brand" href="/login" aria-label="Jobtrack home"><span className="auth-brand-mark">J</span><span>job<strong>track</strong></span></a>
      <div className="auth-heading">
        <h1 id="auth-title">{registering ? 'Create your account' : 'Welcome back'}</h1>
        <p>{registering ? 'Choose a username or use your email address, then create a password.' : 'Sign in to continue tracking your applications.'}</p>
      </div>

      {notice && <p className="auth-notice" role="status">{notice}</p>}
      {status === 'unavailable' && <div className="auth-unavailable" role="alert">
        <p>We couldn’t check your session. Check your connection and try again.</p>
        <button type="button" onClick={retryRestore}>Retry</button>
      </div>}

      <form className="auth-form" onSubmit={submit} noValidate>
        <label className="auth-field" htmlFor="auth-username">Username or email
          <input id="auth-username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck="false" minLength={3} maxLength={254} value={username} onChange={(event) => { setUsername(event.target.value); setError(''); setFieldErrors((current) => ({ ...current, username: '' })); }} onBlur={() => validateField('username')} aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'username-error' : undefined} required disabled={busy}/>
          {fieldErrors.username && <small id="username-error" className="auth-field-error" role="alert">{fieldErrors.username}</small>}
        </label>

        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <div className="auth-password-control">
            <input id="auth-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 12 : undefined} maxLength={128} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); setFieldErrors((current) => ({ ...current, password: '' })); }} onBlur={() => validateField('password')} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} required disabled={busy}/>
            <button className="auth-password-toggle" type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} disabled={busy}>
              {passwordVisible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
            </button>
          </div>
          {fieldErrors.password && <small id="password-error" className="auth-field-error" role="alert">{fieldErrors.password}</small>}
        </div>

        {registering && <div className="auth-field">
          <label htmlFor="auth-confirm-password">Confirm password</label>
          <div className="auth-password-control">
            <input id="auth-confirm-password" name="confirm-password" type={confirmPasswordVisible ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: '' })); }} onBlur={() => validateField('confirmPassword')} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined} required disabled={busy}/>
            <button className="auth-password-toggle" type="button" onClick={() => setConfirmPasswordVisible((visible) => !visible)} aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmPasswordVisible} disabled={busy}>
              {confirmPasswordVisible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
            </button>
          </div>
          {fieldErrors.confirmPassword && <small id="confirm-password-error" className="auth-field-error" role="alert">{fieldErrors.confirmPassword}</small>}
        </div>}

        {!registering && <div className="auth-login-options">
          <label className="auth-remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={busy}/> <span>Remember me</span></label>
        </div>}
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
    </section>
  </main>;
}

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

function modeFromPath() {
  return window.location.pathname === '/register' || window.location.pathname === '/sign-up' ? 'register' : 'login';
}

export default function LoginPage() {
  const { authenticate, confirmEmail, sendVerificationAgain, notice, status, retryRestore } = useAuth();
  const [mode, setMode] = useState(modeFromPath);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  useEffect(() => {
    const syncMode = () => {
      setMode(modeFromPath());
      setError('');
      setFeedback('');
      setVerificationStep(false);
      setVerificationCode('');
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
    setFeedback('');
    setVerificationStep(false);
    setVerificationCode('');
    setPassword('');
    setConfirmPassword('');
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);
    window.history.pushState({}, '', next === 'register' ? '/register' : '/login');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    if (verificationStep) {
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('Enter the six-digit code from your email.');
        return;
      }
      setBusy(true);
      try {
        const result = await confirmEmail(verificationEmail, verificationCode);
        setVerificationStep(false);
        setVerificationCode('');
        setMode('login');
        setPassword('');
        window.history.replaceState({}, '', '/login');
        setFeedback(result.message || 'Email verified. You can now sign in.');
      } catch (requestError) { setError(requestError.message); }
      finally { setBusy(false); }
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    if (registering && (!normalizedFirstName || normalizedFirstName.length > 80 || !normalizedLastName || normalizedLastName.length > 80)) {
      setError('Enter a first name and last name, each no longer than 80 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (registering && (password.length < 12 || password.length > 128 || !/\S/.test(password))) {
      setError('Use a password between 12 and 128 characters, including at least one non-space character.');
      return;
    }
    if (registering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await authenticate({ ...(registering ? { firstName: normalizedFirstName, lastName: normalizedLastName } : {}), email: normalizedEmail, password }, mode);
      if (registering) {
        setVerificationEmail(normalizedEmail);
        setVerificationStep(true);
        setFeedback(result.message || 'Check your email for a verification code.');
      }
    }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const resendCode = async () => {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const result = await sendVerificationAgain(verificationEmail);
      setFeedback(result.message || 'If this email needs verification, a code has been sent.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  return <main className="auth-page">
    <section className="auth-panel" aria-labelledby="auth-title">
      <a className="auth-brand" href="/login" aria-label="Jobtrack home"><span className="auth-brand-mark">J</span><span>job<strong>track</strong></span></a>
      <div className="auth-heading">
        <p className="auth-eyebrow">YOUR PRIVATE JOB SEARCH</p>
        <h1 id="auth-title">{verificationStep ? 'Verify your email' : registering ? 'Create your account' : 'Welcome back'}</h1>
        <p>{verificationStep ? `Enter the six-digit code sent to ${verificationEmail}.` : registering ? 'Keep every application and next step in one private place.' : 'Sign in to continue tracking your applications.'}</p>
      </div>

      {notice && <p className="auth-notice" role="status">{notice}</p>}
      {feedback && <p className="auth-notice" role="status">{feedback}</p>}
      {status === 'unavailable' && <div className="auth-unavailable" role="alert">
        <p>We couldn’t check your session. Check your connection and try again.</p>
        <button type="button" onClick={retryRestore}>Retry</button>
      </div>}

      <form className="auth-form" onSubmit={submit} noValidate>
        {verificationStep ? <>
          <label className="auth-field" htmlFor="auth-verification-code">Verification code
            <input id="auth-verification-code" name="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required disabled={busy} />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Verify email'}</button>
          <button className="auth-secondary" type="button" onClick={resendCode} disabled={busy}>{busy ? 'Please wait…' : 'Resend code'}</button>
          <button className="auth-back-link" type="button" onClick={() => { setVerificationStep(false); setError(''); setFeedback(''); }} disabled={busy}>Use another email</button>
          <button className="auth-back-link" type="button" onClick={() => changeMode('login')} disabled={busy}>Back to sign in</button>
        </> : <>
        {registering && <div className="auth-name-fields">
          <label className="auth-field" htmlFor="auth-first-name">First name
            <input id="auth-first-name" name="given-name" type="text" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} required disabled={busy}/>
          </label>
          <label className="auth-field" htmlFor="auth-last-name">Last name
            <input id="auth-last-name" name="family-name" type="text" autoComplete="family-name" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} required disabled={busy}/>
          </label>
        </div>}
        <label className="auth-field" htmlFor="auth-email">Email address
          <input id="auth-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck="false" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy}/>
        </label>
        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <div className="auth-password-control">
            <input id="auth-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 12 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy}/>
            <button className="auth-password-toggle" type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} disabled={busy}>
              {passwordVisible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
            </button>
          </div>
        </div>
        {registering && <div className="auth-field">
          <label htmlFor="auth-confirm-password">Confirm password</label>
          <div className="auth-password-control">
            <input id="auth-confirm-password" name="confirm-password" type={confirmPasswordVisible ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required disabled={busy}/>
            <button className="auth-password-toggle" type="button" onClick={() => setConfirmPasswordVisible((visible) => !visible)} aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmPasswordVisible} disabled={busy}>
              {confirmPasswordVisible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
            </button>
          </div>
        </div>}
        {registering && <p className="auth-help">Use 12–128 characters. Your password is never stored in this browser.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
        </button>
        </>}
      </form>

      {!verificationStep && <p className="auth-switch">{registering ? 'Already have an account?' : 'New to Jobtrack?'}{' '}
        <button type="button" onClick={() => changeMode(registering ? 'login' : 'register')} disabled={busy}>
          {registering ? 'Sign in' : 'Create an account'}
        </button>
      </p>}
      <p className="auth-privacy">Your job search data belongs to your account and is only available after you sign in.</p>
    </section>
  </main>;
}

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  useEffect(() => {
    const syncMode = () => {
      setMode(modeFromPath());
      setError('');
      setFieldErrors({});
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
    setFieldErrors({});
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
    setFieldErrors({});
    if (verificationStep) {
      if (!/^\d{6}$/.test(verificationCode)) {
        setFieldErrors({ verificationCode: 'Enter the six-digit code from your email.' });
        document.getElementById('auth-verification-code')?.focus();
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
    const validation = {};
    if (registering && !normalizedFirstName) validation.firstName = 'Enter your first name.';
    else if (registering && normalizedFirstName.length > 80) validation.firstName = 'First name must be 80 characters or fewer.';
    if (registering && !normalizedLastName) validation.lastName = 'Enter your last name.';
    else if (registering && normalizedLastName.length > 80) validation.lastName = 'Last name must be 80 characters or fewer.';
    if (!normalizedEmail) validation.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) validation.email = 'Enter a valid email address.';
    if (!password) validation.password = 'Enter your password.';
    else if (password.length > 128) validation.password = 'Password must be 128 characters or fewer.';
    else if (registering && (Array.from(password).length < 12 || !/\S/.test(password))) validation.password = 'Use 12–128 characters and include at least one non-space character.';
    if (registering && !confirmPassword) validation.confirmPassword = 'Confirm your password.';
    else if (registering && password !== confirmPassword) validation.confirmPassword = 'Passwords do not match.';
    if (Object.keys(validation).length) {
      setFieldErrors(validation);
      const firstInvalid = Object.keys(validation)[0];
      const inputIds = { firstName: 'auth-first-name', lastName: 'auth-last-name', email: 'auth-email', password: 'auth-password', confirmPassword: 'auth-confirm-password' };
      document.getElementById(inputIds[firstInvalid])?.focus();
      return;
    }
    setBusy(true);
    try {
      const result = await authenticate({ ...(registering ? { firstName: normalizedFirstName, lastName: normalizedLastName } : { rememberMe }), email: normalizedEmail, password }, mode);
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

  return <main className={`auth-page ${registering && !verificationStep ? 'auth-register-page' : ''}`}>
    <section className="auth-panel" aria-labelledby="auth-title">
      <a className="auth-brand" href="/login" aria-label="Jobtrack home"><span className="auth-brand-mark">J</span><span>job<strong>track</strong></span></a>
      <div className="auth-heading">
        {!registering && <p className="auth-eyebrow">YOUR PRIVATE JOB SEARCH</p>}
        <h1 id="auth-title">{verificationStep ? 'Verify your email' : registering ? 'Create your account' : 'Welcome back'}</h1>
        {(!registering || verificationStep) && <p>{verificationStep ? `Enter the six-digit code sent to ${verificationEmail}.` : 'Sign in to continue tracking your applications.'}</p>}
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
            <input id="auth-verification-code" name="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => { setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors((current) => ({ ...current, verificationCode: '' })); }} aria-invalid={Boolean(fieldErrors.verificationCode)} aria-describedby={fieldErrors.verificationCode ? 'verification-code-error' : undefined} required disabled={busy} />
          </label>
          {fieldErrors.verificationCode && <p id="verification-code-error" className="auth-field-error" role="alert">{fieldErrors.verificationCode}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Verify email'}</button>
          <button className="auth-secondary" type="button" onClick={resendCode} disabled={busy}>{busy ? 'Please wait…' : 'Resend code'}</button>
          <button className="auth-back-link" type="button" onClick={() => { setVerificationStep(false); setError(''); setFeedback(''); }} disabled={busy}>Use another email</button>
          <button className="auth-back-link" type="button" onClick={() => changeMode('login')} disabled={busy}>Back to sign in</button>
        </> : <>
        {registering && <div className="auth-name-fields">
          <label className="auth-field" htmlFor="auth-first-name">First name
            <input id="auth-first-name" name="given-name" type="text" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => { setFirstName(event.target.value); setFieldErrors((current) => ({ ...current, firstName: '' })); }} aria-invalid={Boolean(fieldErrors.firstName)} aria-describedby={fieldErrors.firstName ? 'first-name-error' : undefined} required disabled={busy}/>
            {fieldErrors.firstName && <small id="first-name-error" className="auth-field-error" role="alert">{fieldErrors.firstName}</small>}
          </label>
          <label className="auth-field" htmlFor="auth-last-name">Last name
            <input id="auth-last-name" name="family-name" type="text" autoComplete="family-name" maxLength={80} value={lastName} onChange={(event) => { setLastName(event.target.value); setFieldErrors((current) => ({ ...current, lastName: '' })); }} aria-invalid={Boolean(fieldErrors.lastName)} aria-describedby={fieldErrors.lastName ? 'last-name-error' : undefined} required disabled={busy}/>
            {fieldErrors.lastName && <small id="last-name-error" className="auth-field-error" role="alert">{fieldErrors.lastName}</small>}
          </label>
        </div>}
        <label className="auth-field" htmlFor="auth-email">Email address
          <input id="auth-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck="false" maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })); }} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} required disabled={busy}/>
          {fieldErrors.email && <small id="email-error" className="auth-field-error" role="alert">{fieldErrors.email}</small>}
        </label>
        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <div className="auth-password-control">
            <input id="auth-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 12 : undefined} maxLength={128} value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} required disabled={busy}/>
            <button className="auth-password-toggle" type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} disabled={busy}>
              {passwordVisible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
            </button>
          </div>
          {fieldErrors.password && <small id="password-error" className="auth-field-error" role="alert">{fieldErrors.password}</small>}
        </div>
        {registering && <div className="auth-field">
          <label htmlFor="auth-confirm-password">Confirm password</label>
          <div className="auth-password-control">
            <input id="auth-confirm-password" name="confirm-password" type={confirmPasswordVisible ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: '' })); }} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined} required disabled={busy}/>
            <button className="auth-password-toggle" type="button" onClick={() => setConfirmPasswordVisible((visible) => !visible)} aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmPasswordVisible} disabled={busy}>
              {confirmPasswordVisible ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
            </button>
          </div>
          {fieldErrors.confirmPassword && <small id="confirm-password-error" className="auth-field-error" role="alert">{fieldErrors.confirmPassword}</small>}
        </div>}
        {!registering && <label className="auth-remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={busy}/> <span>Remember me</span></label>}
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
    </section>
  </main>;
}

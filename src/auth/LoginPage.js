import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import {
  requestPasswordReset,
  resendResetCode,
  resetPassword as submitResetPassword,
  verifyResetCode,
} from '../services/authApi';

const passwordByteLength = (value) => new TextEncoder().encode(value).length;

const validUsername = (value) => {
  const normalized = value.trim().toLowerCase();
  if (/^[a-z0-9._-]{3,32}$/.test(normalized)) return true;
  return validEmail(normalized);
};

const validEmail = (value) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 6 || normalized.length > 254) return false;
  const [localPart, ...domainParts] = normalized.split('@');
  if (!localPart || localPart.length > 64 || domainParts.length !== 1) return false;
  const domain = domainParts[0];
  return Boolean(
    domain &&
    domain.length <= 253 &&
    domain.includes('.') &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart) &&
    domain.split('.').every(
      (label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    )
  );
};

function modeFromPath() {
  const path = window.location.pathname;
  if (path === '/register' || path === '/sign-up') return 'register';
  if (path === '/forgot-password') return 'forgot-password';
  if (path === '/reset-password') return 'reset-password';
  return 'login';
}

export default function LoginPage() {
  const { authenticate, verifyRegistration, resendRegistrationCode, notice, status, retryRestore } = useAuth();
  const [mode, setMode] = useState(modeFromPath);

  // Common auth state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration verification state
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendWait, setResendWait] = useState(0);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetResendWait, setResetResendWait] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmNewPasswordVisible, setConfirmNewPasswordVisible] = useState(false);

  // Messages and control
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Registration resend countdown
  useEffect(() => {
    if (resendWait <= 0) return undefined;
    const timer = window.setTimeout(() => setResendWait((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendWait]);

  // Reset code resend countdown
  useEffect(() => {
    if (resetResendWait <= 0) return undefined;
    const timer = window.setTimeout(() => setResetResendWait((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resetResendWait]);

  // History / Popstate handler
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
    if (next !== 'reset-password') {
      setResetCode('');
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    if (next !== 'register') {
      setVerificationEmail('');
      setVerificationCode('');
    }
    window.history.pushState({}, '', `/${next}`);
  };

  const validateField = (field) => {
    let message = '';
    if (field === 'username') {
      if (!username.trim()) {
        message = mode === 'register' ? 'Enter your email address.' : 'Enter a username or email address.';
      } else if (mode === 'register' ? !validEmail(username) : !validUsername(username)) {
        message = mode === 'register' ? 'Enter a valid email address.' : 'Enter a valid username or email address.';
      }
    } else if (field === 'password') {
      if (!password) {
        message = 'Enter your password.';
      } else if (password.length > 128) {
        message = 'Password must be 128 characters or fewer.';
      } else if (mode === 'register' && passwordByteLength(password) > 72) {
        message = 'Password must be no more than 72 bytes when encoded.';
      } else if (mode === 'register' && (Array.from(password).length < 12 || !/\S/.test(password))) {
        message = 'Use 12–128 characters and include at least one non-space character.';
      }
    } else if (field === 'confirmPassword') {
      if (!confirmPassword) {
        message = 'Confirm your password.';
      } else if (password !== confirmPassword) {
        message = 'Passwords do not match.';
      }
    } else if (field === 'resetEmail') {
      if (!resetEmail.trim()) {
        message = 'Enter your email address.';
      } else if (!validEmail(resetEmail)) {
        message = 'Enter a valid email address.';
      }
    } else if (field === 'newPassword') {
      if (!newPassword) {
        message = 'Enter a new password.';
      } else if (newPassword.length > 128) {
        message = 'Password must be 128 characters or fewer.';
      } else if (passwordByteLength(newPassword) > 72) {
        message = 'Password must be no more than 72 bytes when encoded.';
      } else if (Array.from(newPassword).length < 12 || !/\S/.test(newPassword)) {
        message = 'Use 12–128 characters and include at least one non-space character.';
      }
    } else if (field === 'confirmNewPassword') {
      if (!confirmNewPassword) {
        message = 'Confirm your new password.';
      } else if (newPassword !== confirmNewPassword) {
        message = 'Passwords do not match.';
      }
    }
    setFieldErrors((current) => ({ ...current, [field]: message }));
    return message;
  };

  // 1. Submit Login or Registration Details
  const submitAuth = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessNotice('');
    setFieldErrors({});

    const fields = ['username', 'password', ...(mode === 'register' ? ['confirmPassword'] : [])];
    const messages = fields.map((f) => [f, validateField(f)]).filter(([, msg]) => msg);
    if (messages.length) {
      setFieldErrors(Object.fromEntries(messages));
      const inputIds = {
        username: 'auth-username',
        password: 'auth-password',
        confirmPassword: 'auth-confirm-password',
      };
      document.getElementById(inputIds[messages[0][0]])?.focus();
      return;
    }

    setBusy(true);
    if (mode === 'login') setPasswordVisible(false);
    try {
      const result = await authenticate(
        { username: username.trim().toLowerCase(), password, confirmPassword, rememberMe },
        mode
      );
      if (mode === 'register') {
        setVerificationEmail(result.email || username.trim().toLowerCase());
        setVerificationCode('');
        setResendWait(60);
      }
    } catch (requestError) {
      setError(requestError.message);
      if (mode === 'login') {
        setPassword('');
        setPasswordVisible(false);
      }
    } finally {
      setBusy(false);
    }
  };

  // 2. Submit Registration Email Verification Code
  const submitVerification = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError('Enter the six-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      await verifyRegistration({ email: verificationEmail, code: verificationCode.trim() });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  // Resend Registration Code
  const resendVerification = async () => {
    if (resendWait > 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      await resendRegistrationCode(verificationEmail);
      setVerificationCode('');
      setResendWait(60);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  // 3. Submit Forgot Password Request
  const submitForgotPassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessNotice('');
    setFieldErrors({});

    const msg = validateField('resetEmail');
    if (msg) {
      setFieldErrors({ resetEmail: msg });
      document.getElementById('auth-reset-email')?.focus();
      return;
    }

    setBusy(true);
    try {
      await requestPasswordReset({ email: resetEmail.trim().toLowerCase() });
      setResetCode('');
      setResetToken('');
      setResetResendWait(60);
      changeMode('reset-password');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  // 4. Submit Reset Password OTP Code
  const submitResetCode = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError('Enter the six-digit code from your email.');
      return;
    }

    setBusy(true);
    try {
      const result = await verifyResetCode({
        email: resetEmail.trim().toLowerCase(),
        code: resetCode.trim(),
      });
      setResetToken(result.resetToken);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  // Resend Reset Password Code
  const resendReset = async () => {
    if (resetResendWait > 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      await resendResetCode({ email: resetEmail.trim().toLowerCase() });
      setResetCode('');
      setResetResendWait(60);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  // 5. Submit New Password to complete reset
  const submitNewPassword = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const fields = ['newPassword', 'confirmNewPassword'];
    const messages = fields.map((f) => [f, validateField(f)]).filter(([, msg]) => msg);
    if (messages.length) {
      setFieldErrors(Object.fromEntries(messages));
      document.getElementById(messages[0][0] === 'newPassword' ? 'auth-new-password' : 'auth-confirm-new-password')?.focus();
      return;
    }

    setBusy(true);
    try {
      await submitResetPassword({
        email: resetEmail.trim().toLowerCase(),
        resetToken,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setUsername(resetEmail.trim().toLowerCase());
      setSuccessNotice('Your password has been reset successfully! Please sign in with your new password.');
      changeMode('login');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';

  return (
    <main className={`auth-page ${isRegister ? 'auth-register-page' : ''}`}>
      <section className="auth-panel" aria-labelledby="auth-title">
        <a className="auth-brand" href="/login" aria-label="Jobtrack home">
          <span className="auth-brand-mark">J</span>
          <span>job<strong>track</strong></span>
        </a>

        <div className="auth-heading">
          <h1 id="auth-title">
            {isRegister && verificationEmail
              ? 'Check your email'
              : isRegister
              ? 'Create your account'
              : isForgotPassword
              ? 'Reset your password'
              : isResetPassword && !resetToken
              ? 'Enter reset code'
              : isResetPassword && resetToken
              ? 'Choose new password'
              : 'Welcome back'}
          </h1>
          <p>
            {isRegister && verificationEmail
              ? `Enter the six-digit code sent to ${verificationEmail}. It expires in 10 minutes.`
              : isRegister
              ? 'Enter your email address and choose a password.'
              : isForgotPassword
              ? "Enter your email address and we'll send you a six-digit verification code."
              : isResetPassword && !resetToken
              ? `Enter the six-digit code sent to ${resetEmail || 'your email'}. It expires in 10 minutes.`
              : isResetPassword && resetToken
              ? 'Create a strong password of at least 12 characters.'
              : 'Sign in to continue tracking your applications.'}
          </p>
        </div>

        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {successNotice && <p className="auth-notice" role="status">{successNotice}</p>}
        {status === 'unavailable' && (
          <div className="auth-unavailable" role="alert">
            <p>We couldn’t check your session. Check your connection and try again.</p>
            <button type="button" onClick={retryRestore}>Retry</button>
          </div>
        )}

        {/* ---------------- FLOW A: Registration OTP Verification ---------------- */}
        {isRegister && verificationEmail ? (
          <form className="auth-form" onSubmit={submitVerification} noValidate>
            <label className="auth-field" htmlFor="auth-verification-code">
              Verification code
              <input
                id="auth-verification-code"
                name="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                value={verificationCode}
                onChange={(event) => {
                  setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                aria-label="Six-digit email verification code"
                required
                disabled={busy}
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Verify email and continue'}
            </button>
            <button
              className="auth-secondary"
              type="button"
              onClick={resendVerification}
              disabled={busy || resendWait > 0}
            >
              {resendWait > 0 ? `Send another code in ${resendWait}s` : 'Resend verification code'}
            </button>
            <button
              className="auth-back-link"
              type="button"
              onClick={() => {
                setVerificationEmail('');
                setVerificationCode('');
                setError('');
              }}
              disabled={busy}
            >
              Back to registration
            </button>
          </form>
        ) : isForgotPassword ? (
          /* ---------------- FLOW B: Request Forgot Password Code ---------------- */
          <form className="auth-form" onSubmit={submitForgotPassword} noValidate>
            <label className="auth-field" htmlFor="auth-reset-email">
              Email address
              <input
                id="auth-reset-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                maxLength={254}
                value={resetEmail}
                onChange={(event) => {
                  setResetEmail(event.target.value);
                  setError('');
                  setFieldErrors((curr) => ({ ...curr, resetEmail: '' }));
                }}
                onBlur={() => validateField('resetEmail')}
                aria-invalid={Boolean(fieldErrors.resetEmail)}
                aria-describedby={fieldErrors.resetEmail ? 'reset-email-error' : undefined}
                required
                disabled={busy}
              />
              {fieldErrors.resetEmail && (
                <small id="reset-email-error" className="auth-field-error" role="alert">
                  {fieldErrors.resetEmail}
                </small>
              )}
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Send reset code'}
            </button>
            <button
              className="auth-back-link"
              type="button"
              onClick={() => changeMode('login')}
              disabled={busy}
            >
              Back to sign in
            </button>
          </form>
        ) : isResetPassword ? (
          /* ---------------- FLOW C: Reset Password (OTP or New Password) ---------------- */
          !resetToken ? (
            /* Step C1: Enter 6-digit Reset OTP */
            <form className="auth-form" onSubmit={submitResetCode} noValidate>
              <label className="auth-field" htmlFor="auth-reset-code">
                Reset verification code
                <input
                  id="auth-reset-code"
                  name="reset-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  value={resetCode}
                  onChange={(event) => {
                    setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  aria-label="Six-digit password reset code"
                  required
                  disabled={busy}
                />
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : 'Verify reset code'}
              </button>
              <button
                className="auth-secondary"
                type="button"
                onClick={resendReset}
                disabled={busy || resetResendWait > 0}
              >
                {resetResendWait > 0 ? `Send another code in ${resetResendWait}s` : 'Resend reset code'}
              </button>
              <button
                className="auth-back-link"
                type="button"
                onClick={() => changeMode('login')}
                disabled={busy}
              >
                Back to sign in
              </button>
            </form>
          ) : (
            /* Step C2: Enter New Password */
            <form className="auth-form" onSubmit={submitNewPassword} noValidate>
              <div className="auth-field">
                <label htmlFor="auth-new-password">New password</label>
                <div className="auth-password-control">
                  <input
                    id="auth-new-password"
                    name="new-password"
                    type={newPasswordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setError('');
                      setFieldErrors((curr) => ({ ...curr, newPassword: '' }));
                    }}
                    onBlur={() => validateField('newPassword')}
                    aria-invalid={Boolean(fieldErrors.newPassword)}
                    aria-describedby={fieldErrors.newPassword ? 'new-password-error' : undefined}
                    required
                    disabled={busy}
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setNewPasswordVisible((v) => !v)}
                    aria-label={newPasswordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={newPasswordVisible}
                    disabled={busy}
                  >
                    {newPasswordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.newPassword && (
                  <small id="new-password-error" className="auth-field-error" role="alert">
                    {fieldErrors.newPassword}
                  </small>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="auth-confirm-new-password">Confirm new password</label>
                <div className="auth-password-control">
                  <input
                    id="auth-confirm-new-password"
                    name="confirm-new-password"
                    type={confirmNewPasswordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    value={confirmNewPassword}
                    onChange={(event) => {
                      setConfirmNewPassword(event.target.value);
                      setError('');
                      setFieldErrors((curr) => ({ ...curr, confirmNewPassword: '' }));
                    }}
                    onBlur={() => validateField('confirmNewPassword')}
                    aria-invalid={Boolean(fieldErrors.confirmNewPassword)}
                    aria-describedby={fieldErrors.confirmNewPassword ? 'confirm-new-password-error' : undefined}
                    required
                    disabled={busy}
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setConfirmNewPasswordVisible((v) => !v)}
                    aria-label={confirmNewPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'}
                    aria-pressed={confirmNewPasswordVisible}
                    disabled={busy}
                  >
                    {confirmNewPasswordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.confirmNewPassword && (
                  <small id="confirm-new-password-error" className="auth-field-error" role="alert">
                    {fieldErrors.confirmNewPassword}
                  </small>
                )}
              </div>

              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : 'Save new password and sign in'}
              </button>
              <button
                className="auth-back-link"
                type="button"
                onClick={() => changeMode('login')}
                disabled={busy}
              >
                Back to sign in
              </button>
            </form>
          )
        ) : (
          /* ---------------- FLOW D: Sign In & Register Form ---------------- */
          <form className="auth-form" onSubmit={submitAuth} noValidate>
            <label className="auth-field" htmlFor="auth-username">
              {isRegister ? 'Email address' : 'Username or email'}
              <input
                id="auth-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                minLength={3}
                maxLength={254}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError('');
                  setFieldErrors((curr) => ({ ...curr, username: '' }));
                }}
                onBlur={() => validateField('username')}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                required
                disabled={busy}
              />
              {fieldErrors.username && (
                <small id="username-error" className="auth-field-error" role="alert">
                  {fieldErrors.username}
                </small>
              )}
            </label>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-password-control">
                <input
                  id="auth-password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={isRegister ? 12 : undefined}
                  maxLength={128}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                    setFieldErrors((curr) => ({ ...curr, password: '' }));
                  }}
                  onBlur={() => validateField('password')}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  required
                  disabled={busy}
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={passwordVisible}
                  disabled={busy}
                >
                  {passwordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && (
                <small id="password-error" className="auth-field-error" role="alert">
                  {fieldErrors.password}
                </small>
              )}
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="auth-confirm-password">Confirm password</label>
                <div className="auth-password-control">
                  <input
                    id="auth-confirm-password"
                    name="confirm-password"
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError('');
                      setFieldErrors((curr) => ({ ...curr, confirmPassword: '' }));
                    }}
                    onBlur={() => validateField('confirmPassword')}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                    required
                    disabled={busy}
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setConfirmPasswordVisible((v) => !v)}
                    aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'}
                    aria-pressed={confirmPasswordVisible}
                    disabled={busy}
                  >
                    {confirmPasswordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <small id="confirm-password-error" className="auth-field-error" role="alert">
                    {fieldErrors.confirmPassword}
                  </small>
                )}
              </div>
            )}

            {!isRegister && (
              <div className="auth-login-options">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={busy}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="auth-forgot-link"
                  type="button"
                  onClick={() => {
                    setResetEmail(username.includes('@') ? username.trim() : '');
                    changeMode('forgot-password');
                  }}
                  disabled={busy}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {/* ---------------- Mode Switcher (Login <-> Register) ---------------- */}
        {!verificationEmail && !isForgotPassword && !isResetPassword && (
          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to Jobtrack?'}{' '}
            <button
              type="button"
              onClick={() => changeMode(isRegister ? 'login' : 'register')}
              disabled={busy}
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        )}
      </section>
    </main>
  );
}

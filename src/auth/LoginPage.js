import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Mail, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from './AuthContext';
import {
  requestPasswordReset,
  resendResetCode,
  resetPassword as submitResetPassword,
  verifyResetCode,
} from '../services/authApi';

const passwordByteLength = (value) => new TextEncoder().encode(value).length;

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

function OtpInputGroup({ value, onChange, disabled, idPrefix = 'otp', ariaLabel = 'Six-digit verification code' }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        const next = digits.slice();
        next[index] = '';
        onChange(next.join(''));
      } else if (index > 0) {
        const next = digits.slice();
        next[index - 1] = '';
        onChange(next.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index, e) => {
    const raw = e.target.value;
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[index] = char;
    const combined = next.join('');
    onChange(combined);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const targetIndex = Math.min(pasted.length, 5);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="otp-boxes-container" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          id={i === 0 ? idPrefix : `${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`otp-digit-box ${digit ? 'otp-digit-box-filled' : ''}`}
          disabled={disabled}
          aria-label={i === 0 ? ariaLabel : `Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
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
      setFirstName('');
      setLastName('');
      setVerificationEmail('');
      setVerificationCode('');
    }
    window.history.pushState({}, '', `/${next}`);
  };

  const validateField = (field) => {
    let message = '';
    if (field === 'firstName') {
      if (!firstName.trim()) {
        message = 'Enter your first name.';
      } else if (firstName.trim().length > 80) {
        message = 'First name must be 80 characters or fewer.';
      }
    } else if (field === 'lastName') {
      if (!lastName.trim()) {
        message = 'Enter your last name.';
      } else if (lastName.trim().length > 80) {
        message = 'Last name must be 80 characters or fewer.';
      }
    } else if (field === 'email' || field === 'username') {
      if (!email.trim()) {
        message = 'Enter your email address.';
      } else if (!validEmail(email)) {
        message = 'Enter a valid email address.';
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

    const fields = [
      ...(mode === 'register' ? ['firstName', 'lastName'] : []),
      'email',
      'password',
      ...(mode === 'register' ? ['confirmPassword'] : []),
    ];
    const messages = fields.map((f) => [f, validateField(f)]).filter(([, msg]) => msg);
    if (messages.length) {
      setFieldErrors(Object.fromEntries(messages));
      const inputIds = {
        firstName: 'auth-first-name',
        lastName: 'auth-last-name',
        email: 'auth-email',
        password: 'auth-password',
        confirmPassword: 'auth-confirm-password',
      };
      document.getElementById(inputIds[messages[0][0]])?.focus();
      return;
    }

    setBusy(true);
    if (mode === 'login') setPasswordVisible(false);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await authenticate(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          username: normalizedEmail,
          password,
          confirmPassword,
          rememberMe,
        },
        mode
      );
      if (mode === 'register') {
        setVerificationEmail(result.email || normalizedEmail);
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
      setEmail(resetEmail.trim().toLowerCase());
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

        {!((isRegister && verificationEmail) || (isResetPassword && !resetToken)) && (
          <div className="auth-heading">
            <h1 id="auth-title">
              {isRegister
                ? 'Create your account'
                : isForgotPassword
                ? 'Reset your password'
                : isResetPassword && resetToken
                ? 'Choose new password'
                : 'Welcome back'}
            </h1>
            <p>
              {isRegister
                ? 'Enter your email address and choose a password.'
                : isForgotPassword
                ? "Enter your email address and we'll send you a six-digit verification code."
                : isResetPassword && resetToken
                ? 'Create a strong password of at least 12 characters.'
                : 'Sign in to continue tracking your applications.'}
            </p>
          </div>
        )}

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
          <div className="otp-card-flow">
            <div className="otp-header">
              <div className="otp-icon-container">
                <Mail size={26} strokeWidth={2.2} />
                <span className="otp-badge-pulse" />
              </div>
              <h2 className="otp-title">Check your email</h2>
              <p className="otp-subtitle">
                We sent a 6-digit verification code to
              </p>
              <div className="otp-email-chip" title={verificationEmail}>
                <span>{verificationEmail}</span>
              </div>
            </div>

            <form className="auth-form" onSubmit={submitVerification} noValidate>
              <div className="otp-input-section">
                <label className="otp-input-label" htmlFor="auth-verification-code">
                  Verification code
                </label>
                <OtpInputGroup
                  value={verificationCode}
                  onChange={(val) => {
                    setVerificationCode(val);
                    setError('');
                  }}
                  idPrefix="auth-verification-code"
                  disabled={busy}
                  ariaLabel="Six-digit email verification code"
                />
                <span className="otp-meta">
                  Code expires in 10 minutes
                </span>
              </div>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button className="auth-submit otp-submit-btn" type="submit" disabled={busy || verificationCode.length !== 6}>
                {busy ? 'Verifying…' : 'Verify email and continue'}
              </button>

              <div className="otp-resend-bar">
                <span>Didn't receive the email?</span>
                <button
                  className="otp-resend-btn"
                  type="button"
                  onClick={resendVerification}
                  disabled={busy || resendWait > 0}
                >
                  <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
                  {resendWait > 0 ? `Send another code in ${resendWait}s` : 'Resend verification code'}
                </button>
              </div>

              <button
                className="otp-back-btn"
                type="button"
                onClick={() => {
                  setVerificationEmail('');
                  setVerificationCode('');
                  setError('');
                }}
                disabled={busy}
              >
                <ArrowLeft size={14} />
                <span>Back to registration</span>
              </button>
            </form>
          </div>
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
            <div className="otp-card-flow">
              <div className="otp-header">
                <div className="otp-icon-container">
                  <KeyRound size={26} strokeWidth={2.2} />
                  <span className="otp-badge-pulse" />
                </div>
                <h2 className="otp-title">Enter reset code</h2>
                <p className="otp-subtitle">
                  We sent a 6-digit password reset code to
                </p>
                <div className="otp-email-chip" title={resetEmail}>
                  <span>{resetEmail || 'your email'}</span>
                </div>
              </div>

              <form className="auth-form" onSubmit={submitResetCode} noValidate>
                <div className="otp-input-section">
                  <label className="otp-input-label" htmlFor="auth-reset-code">
                    Reset code
                  </label>
                  <OtpInputGroup
                    value={resetCode}
                    onChange={(val) => {
                      setResetCode(val);
                      setError('');
                    }}
                    idPrefix="auth-reset-code"
                    disabled={busy}
                    ariaLabel="Six-digit password reset code"
                  />
                  <span className="otp-meta">
                    Code expires in 10 minutes
                  </span>
                </div>

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button className="auth-submit otp-submit-btn" type="submit" disabled={busy || resetCode.length !== 6}>
                  {busy ? 'Verifying…' : 'Verify reset code'}
                </button>

                <div className="otp-resend-bar">
                  <span>Didn't receive the email?</span>
                  <button
                    className="otp-resend-btn"
                    type="button"
                    onClick={resendReset}
                    disabled={busy || resetResendWait > 0}
                  >
                    <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
                    {resetResendWait > 0 ? `Send another code in ${resetResendWait}s` : 'Resend reset code'}
                  </button>
                </div>

                <button
                  className="otp-back-btn"
                  type="button"
                  onClick={() => changeMode('login')}
                  disabled={busy}
                >
                  <ArrowLeft size={14} />
                  <span>Back to sign in</span>
                </button>
              </form>
            </div>
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
            {isRegister && (
              <div className="auth-name-fields">
                <label className="auth-field" htmlFor="auth-first-name">
                  First name
                  <input
                    id="auth-first-name"
                    name="given-name"
                    type="text"
                    autoComplete="given-name"
                    maxLength={80}
                    value={firstName}
                    onChange={(event) => {
                      setFirstName(event.target.value);
                      setError('');
                      setFieldErrors((curr) => ({ ...curr, firstName: '' }));
                    }}
                    onBlur={() => validateField('firstName')}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby={fieldErrors.firstName ? 'first-name-error' : undefined}
                    required
                    disabled={busy}
                  />
                  {fieldErrors.firstName && (
                    <small id="first-name-error" className="auth-field-error" role="alert">
                      {fieldErrors.firstName}
                    </small>
                  )}
                </label>
                <label className="auth-field" htmlFor="auth-last-name">
                  Last name
                  <input
                    id="auth-last-name"
                    name="family-name"
                    type="text"
                    autoComplete="family-name"
                    maxLength={80}
                    value={lastName}
                    onChange={(event) => {
                      setLastName(event.target.value);
                      setError('');
                      setFieldErrors((curr) => ({ ...curr, lastName: '' }));
                    }}
                    onBlur={() => validateField('lastName')}
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby={fieldErrors.lastName ? 'last-name-error' : undefined}
                    required
                    disabled={busy}
                  />
                  {fieldErrors.lastName && (
                    <small id="last-name-error" className="auth-field-error" role="alert">
                      {fieldErrors.lastName}
                    </small>
                  )}
                </label>
              </div>
            )}

            <label className="auth-field" htmlFor="auth-email">
              Email address
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                maxLength={254}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                  setFieldErrors((curr) => ({ ...curr, email: '' }));
                }}
                onBlur={() => validateField('email')}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                required
                disabled={busy}
              />
              {fieldErrors.email && (
                <small id="email-error" className="auth-field-error" role="alert">
                  {fieldErrors.email}
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
                    setResetEmail(email.includes('@') ? email.trim() : '');
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

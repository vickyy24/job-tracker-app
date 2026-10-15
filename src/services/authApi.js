import { apiRequest, restoreSession, setCsrfToken } from './apiClient';

export { restoreSession, setCsrfToken };

export function registerAccount({ email, username, password, confirmPassword }) {
  const targetEmail = email || username;
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: targetEmail, username: targetEmail, password, confirmPassword }),
  });
}

export function verifyRegistrationCode({ email, code }) {
  return apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function resendRegistrationCode({ email }) {
  return apiRequest('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function requestPasswordReset({ email }) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyResetCode({ email, code }) {
  return apiRequest('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function resendResetCode({ email }) {
  return apiRequest('/auth/resend-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword({ email, resetToken, newPassword, confirmPassword }) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, resetToken, newPassword, confirmPassword }),
  });
}

export function signIn({ email, username, password, rememberMe }) {
  const targetEmail = email || username;
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: targetEmail, username: targetEmail, password, rememberMe }),
  });
}

export function signOut() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

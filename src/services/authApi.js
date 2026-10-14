import { apiRequest, restoreSession, setCsrfToken } from './apiClient';

export { restoreSession, setCsrfToken };

export function registerAccount({ firstName, lastName, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
}

export function signIn({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function verifyEmail({ email, code }) {
  return apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function resendVerification(email) {
  return apiRequest('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function signOut() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

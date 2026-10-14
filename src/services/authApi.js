import { apiRequest, restoreSession, setCsrfToken } from './apiClient';

export { restoreSession, setCsrfToken };

export function registerAccount({ email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signIn({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signOut() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

import { apiRequest, restoreSession, setCsrfToken } from './apiClient';

export { restoreSession, setCsrfToken };

export function registerAccount({ username, password, confirmPassword }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, confirmPassword }),
  });
}

export function signIn({ username, password, rememberMe }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, rememberMe }),
  });
}

export function signOut() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

const API_BASE_URL = (
  process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api')
).replace(/\/+$/, '');

let csrfToken = '';
let refreshPromise = null;

export function setCsrfToken(token) {
  csrfToken = typeof token === 'string' ? token : '';
}

function createError(message, status) {
  const error = new Error(message || 'The request could not be completed.');
  error.status = status;
  return error;
}

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) headers.set('X-CSRF-Token', csrfToken);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw createError(data.message || 'The request could not be completed.', response.status);
    return data;
  } catch (error) {
    if (error instanceof TypeError || error.name === 'AbortError') {
      const connectionError = new Error(error.name === 'AbortError'
        ? 'The API took too long to respond. Please try again.'
        : 'Unable to connect to the API. Please try again shortly.');
      connectionError.status = 0;
      throw connectionError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        if (!csrfToken) {
          const csrf = await fetchJson('/auth/csrf');
          setCsrfToken(csrf.csrfToken);
        }
        const session = await fetchJson('/auth/refresh', { method: 'POST' });
        setCsrfToken(session.csrfToken);
        return session;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function restoreSession() {
  try {
    const session = await fetchJson('/auth/session');
    setCsrfToken(session.csrfToken);
    return session;
  } catch (error) {
    if (error.status !== 401) throw error;
  }

  try {
    const session = await refreshSession();
    setCsrfToken(session.csrfToken);
    return session;
  } catch (error) {
    setCsrfToken('');
    if (error.status === 401) return null;
    throw error;
  }
}

export async function apiRequest(path, options = {}, { retryAfterRefresh = false } = {}) {
  try {
    return await fetchJson(path, options);
  } catch (error) {
    if (error.status !== 401 || !retryAfterRefresh) throw error;
    try {
      await refreshSession();
      return await fetchJson(path, options);
    } catch (refreshError) {
      if (refreshError.status === 401 || refreshError.status === 403) {
        setCsrfToken('');
        window.dispatchEvent(new Event('jobtrack:session-expired'));
      }
      throw refreshError;
    }
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

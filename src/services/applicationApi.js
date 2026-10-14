const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    const error = new Error('Unable to connect to the API. Please try again shortly.');
    error.status = 0;
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'The request could not be completed.');
    error.status = response.status;
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event('jobtracker:unauthorized'));
    }
    throw error;
  }

  return data;
}

export function getAuthSession() {
  return request('/auth/session');
}

export function login(password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export function listApplications({ search, status, sortBy = 'applicationDate', order = 'desc' } = {}) {
  const params = new URLSearchParams({ sortBy, order });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return request(`/applications?${params.toString()}`);
}

export function getApplicationStats() {
  return request('/applications/stats');
}

export function getApplication(id) {
  return request(`/applications/${encodeURIComponent(id)}`);
}

export function createApplication(application) {
  return request('/applications', {
    method: 'POST',
    body: JSON.stringify(application),
  });
}

export function updateApplication(id, updates) {
  return request(`/applications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function deleteApplication(id) {
  return request(`/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}


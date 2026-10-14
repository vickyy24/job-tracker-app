import { apiRequest } from './apiClient';

export function listApplications({ search, status, sortBy = 'applicationDate', order = 'desc' } = {}) {
  const params = new URLSearchParams({ sortBy, order });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return apiRequest(`/applications?${params.toString()}`, {}, { retryAfterRefresh: true });
}

export function getApplicationStats() {
  return apiRequest('/applications/stats', {}, { retryAfterRefresh: true });
}

export function getApplication(id) {
  return apiRequest(`/applications/${encodeURIComponent(id)}`, {}, { retryAfterRefresh: true });
}

export function createApplication(application) {
  return apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify(application),
  }, { retryAfterRefresh: true });
}

export function updateApplication(id, updates) {
  return apiRequest(`/applications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }, { retryAfterRefresh: true });
}

export function deleteApplication(id) {
  return apiRequest(`/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, { retryAfterRefresh: true });
}

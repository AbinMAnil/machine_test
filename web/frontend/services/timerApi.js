/**
 * API client for Countdown Timer + Analytics Admin Endpoints
 */

async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Request failed with status ${response.status}` };
    }
    const error = new Error(errorData.error || 'API request failed');
    error.status = response.status;
    error.issues = errorData.issues;
    throw error;
  }
  return response.json();
}

export async function fetchTimers({ status, search, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await fetch(`/api/timers?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchTimer(id) {
  const res = await fetch(`/api/timers/${id}`);
  return handleResponse(res);
}

export async function createTimer(timerData) {
  const res = await fetch('/api/timers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timerData),
  });
  return handleResponse(res);
}

export async function updateTimer(id, timerData) {
  const res = await fetch(`/api/timers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timerData),
  });
  return handleResponse(res);
}

export async function patchTimerStatus(id, status) {
  const res = await fetch(`/api/timers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function deleteTimer(id) {
  const res = await fetch(`/api/timers/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function fetchAnalytics() {
  const res = await fetch('/api/analytics');
  return handleResponse(res);
}

const API_BASE = 'http://127.0.0.1:5000/api';

/**
 * Check health status of the backend API
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { connected: true, data };
  } catch (error) {
    console.warn('Backend API offline or unreachable:', error.message);
    return { connected: false, error: error.message };
  }
}

/**
 * Fetch all registered usernames from the backend
 */
export async function fetchRegisteredUsernames() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to retrieve registered users');
  const data = await res.json();
  return data.usernames || [];
}

/**
 * Check if a username is unique/available in real-time
 */
export async function checkUsernameAvailability(username, signal) {
  const clean = username.trim();
  const res = await fetch(`${API_BASE}/check-username?username=${encodeURIComponent(clean)}`, {
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to check username availability');
  }
  return await res.json();
}

/**
 * Register a new user
 */
export async function registerUser({ username, email, password }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'Registration failed');
    error.status = res.status;
    throw error;
  }

  return data;
}

/**
 * Reset backend database to default presets
 */
export async function resetDatabase() {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset database');
  return await res.json();
}

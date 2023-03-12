// Client API service for communicating with the PostgreSQL Express backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const res = await fetch(url, config)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || `Request failed with status ${res.status}` }
    }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message, offline: true }
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  login: (username, password, role) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),

  // Users
  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/users${q ? `?${q}` : ''}`)
  },
  saveUser: (userData) =>
    request(userData.id ? `/users/${userData.id}` : '/users', {
      method: userData.id ? 'PUT' : 'POST',
      body: JSON.stringify(userData),
    }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id) => request(`/users/${id}/status`, { method: 'PATCH' }),

  // Belongings
  getBelongings: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/belongings${q ? `?${q}` : ''}`)
  },
  createBelonging: (item) =>
    request('/belongings', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  toggleBelongingStatus: (id) => request(`/belongings/${id}/status`, { method: 'PATCH' }),
  deleteBelonging: (id) => request(`/belongings/${id}`, { method: 'DELETE' }),

  // Exit Requests
  getExitRequests: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/exit-requests${q ? `?${q}` : ''}`)
  },
  createExitRequest: (reqData) =>
    request('/exit-requests', {
      method: 'POST',
      body: JSON.stringify(reqData),
    }),
  reviewRequest: (id, decision, note, reviewedBy) =>
    request(`/exit-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, note, reviewedBy }),
    }),
  cancelRequest: (id) => request(`/exit-requests/${id}/cancel`, { method: 'PATCH' }),

  // Gate Operations
  getGateLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/gate/logs${q ? `?${q}` : ''}`)
  },
  recordEntry: (entryData) =>
    request('/gate/entry', {
      method: 'POST',
      body: JSON.stringify(entryData),
    }),
  allowExit: (exitData) =>
    request('/gate/exit', {
      method: 'POST',
      body: JSON.stringify(exitData),
    }),
  denyExit: (denyData) =>
    request('/gate/deny', {
      method: 'POST',
      body: JSON.stringify(denyData),
    }),
}

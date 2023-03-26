// Base HTTP client for communicating with the backend API with JWT Authorization

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const TOKEN_KEY = 'ku-seems:jwt'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage can be unavailable
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const token = getStoredToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const config = {
    ...options,
    headers,
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

export default request

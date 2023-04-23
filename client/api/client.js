// Base HTTP client for communicating with the backend API powered by Axios with JWT Authorization
import axios from 'axios'

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

// Dedicated Axios instance configured with API base URL and JSON content type
export const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request interceptor to automatically attach JWT bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Universal request wrapper powered by Axios.
 * Supports method, data/body, query params, custom headers.
 */
export async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase()

  let data = options.data
  if (data === undefined && options.body !== undefined) {
    if (typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body)
      } catch {
        data = options.body
      }
    } else {
      data = options.body
    }
  }

  try {
    const response = await axiosClient.request({
      url: endpoint,
      method,
      data,
      params: options.params,
      headers: options.headers,
    })
    return { ok: true, data: response.data, status: response.status }
  } catch (err) {
    if (err.response) {
      const errData = err.response.data || {}
      return {
        ok: false,
        status: err.response.status,
        error: errData.error || errData.message || `Request failed with status ${err.response.status}`,
      }
    }
    return {
      ok: false,
      error: err.message || 'Network error',
      offline: true,
    }
  }
}

export default request

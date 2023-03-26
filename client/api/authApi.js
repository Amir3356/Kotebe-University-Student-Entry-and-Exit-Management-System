import { request } from './client'

export const authApi = {
  checkHealth: () => request('/health'),
  login: (username, password, role) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),
  getMe: () => request('/auth/me'),
}

export default authApi

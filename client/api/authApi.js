import { request } from './client'

export const authApi = {
  checkHealth: () => request('/health'),
  login: (username, password, role) =>
    request('/auth/login', {
      method: 'POST',
      data: { username, password, ...(role ? { role } : {}) },
    }),
  getMe: () => request('/auth/me'),
}

export default authApi

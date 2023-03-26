import { request } from './client'

export const userApi = {
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
}

export default userApi

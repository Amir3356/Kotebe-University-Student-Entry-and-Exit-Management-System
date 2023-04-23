import { request } from './client'

export const userApi = {
  getUsers: (params = {}) => request('/users', { params }),
  saveUser: (userData, options = {}) => {
    const idempotencyKey = options.idempotencyKey || userData.idempotencyKey
    const headers = {}
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }
    const { idempotencyKey: _, ...payload } = userData
    return request(payload.id ? `/users/${payload.id}` : '/users', {
      method: payload.id ? 'PUT' : 'POST',
      data: payload,
      headers,
    })
  },
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id) => request(`/users/${id}/status`, { method: 'PATCH' }),
}

export default userApi

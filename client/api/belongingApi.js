import { request } from './client'

export const belongingApi = {
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
}

export default belongingApi

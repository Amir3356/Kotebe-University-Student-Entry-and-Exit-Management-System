import { request } from './client'

export const belongingApi = {
  getBelongings: (params = {}) => request('/belongings', { params }),
  createBelonging: (item) =>
    request('/belongings', {
      method: 'POST',
      data: item,
    }),
  toggleBelongingStatus: (id) => request(`/belongings/${id}/status`, { method: 'PATCH' }),
  deleteBelonging: (id) => request(`/belongings/${id}`, { method: 'DELETE' }),
}

export default belongingApi

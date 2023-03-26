import { request } from './client'

export const requestApi = {
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
}

export default requestApi

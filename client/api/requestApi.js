import { request } from './client'

export const requestApi = {
  getExitRequests: (params = {}) => request('/exit-requests', { params }),
  createExitRequest: (reqData) =>
    request('/exit-requests', {
      method: 'POST',
      data: reqData,
    }),
  reviewRequest: (id, decision, note, reviewedBy) =>
    request(`/exit-requests/${id}/review`, {
      method: 'PATCH',
      data: { decision, note, reviewedBy },
    }),
  cancelRequest: (id) => request(`/exit-requests/${id}/cancel`, { method: 'PATCH' }),
  deleteRequest: (id) => request(`/exit-requests/${id}`, { method: 'DELETE' }),
  updateRequest: (id, data) => request(`/exit-requests/${id}`, { method: 'PUT', data }),
}

export default requestApi

import { request } from './client'

export const gateApi = {
  getGateLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/gate/logs${q ? `?${q}` : ''}`)
  },
  recordEntry: (entryData) =>
    request('/gate/entry', {
      method: 'POST',
      body: JSON.stringify(entryData),
    }),
  allowExit: (exitData) =>
    request('/gate/exit', {
      method: 'POST',
      body: JSON.stringify(exitData),
    }),
  denyExit: (denyData) =>
    request('/gate/deny', {
      method: 'POST',
      body: JSON.stringify(denyData),
    }),
}

export default gateApi

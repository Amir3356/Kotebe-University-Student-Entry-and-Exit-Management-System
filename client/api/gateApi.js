import { request } from './client'

export const gateApi = {
  getGateLogs: (params = {}) => request('/gate/logs', { params }),
  recordEntry: (entryData) =>
    request('/gate/entry', {
      method: 'POST',
      data: entryData,
    }),
  allowExit: (exitData) =>
    request('/gate/exit', {
      method: 'POST',
      data: exitData,
    }),
  denyExit: (denyData) =>
    request('/gate/deny', {
      method: 'POST',
      data: denyData,
    }),
}

export default gateApi

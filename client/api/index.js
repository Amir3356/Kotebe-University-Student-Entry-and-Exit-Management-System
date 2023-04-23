import { request, axiosClient, getStoredToken, setStoredToken, TOKEN_KEY } from './client'
import { authApi } from './authApi'
import { userApi } from './userApi'
import { belongingApi } from './belongingApi'
import { requestApi } from './requestApi'
import { gateApi } from './gateApi'

export {
  request,
  axiosClient,
  getStoredToken,
  setStoredToken,
  TOKEN_KEY,
  authApi,
  userApi,
  belongingApi,
  requestApi,
  gateApi,
}

export const api = {
  ...authApi,
  ...userApi,
  ...belongingApi,
  ...requestApi,
  ...gateApi,
}

export default api

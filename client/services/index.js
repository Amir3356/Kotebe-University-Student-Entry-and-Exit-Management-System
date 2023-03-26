import { authService } from './authService'
import { userService } from './userService'
import { belongingService } from './belongingService'
import { requestService } from './requestService'
import { gateService } from './gateService'

export {
  authService,
  userService,
  belongingService,
  requestService,
  gateService,
}

export const services = {
  auth: authService,
  user: userService,
  belonging: belongingService,
  request: requestService,
  gate: gateService,
}

export default services

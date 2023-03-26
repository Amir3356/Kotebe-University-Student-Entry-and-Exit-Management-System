import { Router } from 'express'
import {
  getGateLogs,
  recordEntry,
  allowExit,
  denyExit,
} from '../controllers/gateController.js'
import { validateBody } from '../middleware/validationMiddleware.js'
import {
  recordEntrySchema,
  allowExitSchema,
  denyExitSchema,
} from '../models/gateLogModel.js'

const router = Router()

router.get('/logs', getGateLogs)
router.post('/entry', validateBody(recordEntrySchema), recordEntry)
router.post('/exit', validateBody(allowExitSchema), allowExit)
router.post('/deny', validateBody(denyExitSchema), denyExit)

export default router

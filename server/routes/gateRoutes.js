import { Router } from 'express'
import {
  getGateLogs,
  recordEntry,
  allowExit,
  denyExit,
} from '../controllers/gateController.js'

const router = Router()

router.get('/logs', getGateLogs)
router.post('/entry', recordEntry)
router.post('/exit', allowExit)
router.post('/deny', denyExit)

export default router

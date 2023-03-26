import { Router } from 'express'
import {
  getExitRequests,
  getExitRequestById,
  createExitRequest,
  reviewRequest,
  cancelRequest,
} from '../controllers/requestController.js'
import { validateBody } from '../middleware/validationMiddleware.js'
import { exitRequestCreateSchema, reviewRequestSchema } from '../models/requestModel.js'

const router = Router()

router.get('/', getExitRequests)
router.get('/:id', getExitRequestById)
router.post('/', validateBody(exitRequestCreateSchema), createExitRequest)
router.patch('/:id/review', validateBody(reviewRequestSchema), reviewRequest)
router.patch('/:id/cancel', cancelRequest)

export default router

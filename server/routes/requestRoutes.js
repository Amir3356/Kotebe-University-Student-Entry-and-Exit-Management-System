import { Router } from 'express'
import {
  getExitRequests,
  getExitRequestById,
  createExitRequest,
  reviewRequest,
  cancelRequest,
} from '../controllers/requestController.js'

const router = Router()

router.get('/', getExitRequests)
router.get('/:id', getExitRequestById)
router.post('/', createExitRequest)
router.patch('/:id/review', reviewRequest)
router.patch('/:id/cancel', cancelRequest)

export default router

import { Router } from 'express'
import {
  getBelongings,
  getBelongingById,
  createBelonging,
  updateBelonging,
  toggleBelongingStatus,
  deleteBelonging,
} from '../controllers/belongingController.js'
import { validateBody } from '../middleware/validationMiddleware.js'
import { belongingCreateSchema, belongingUpdateSchema } from '../models/belongingModel.js'

const router = Router()

router.get('/', getBelongings)
router.get('/:id', getBelongingById)
router.post('/', validateBody(belongingCreateSchema), createBelonging)
router.put('/:id', validateBody(belongingUpdateSchema), updateBelonging)
router.patch('/:id/status', toggleBelongingStatus)
router.delete('/:id', deleteBelonging)

export default router

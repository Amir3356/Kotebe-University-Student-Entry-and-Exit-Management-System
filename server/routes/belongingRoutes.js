import { Router } from 'express'
import {
  getBelongings,
  getBelongingById,
  createBelonging,
  updateBelonging,
  toggleBelongingStatus,
  deleteBelonging,
} from '../controllers/belongingController.js'

const router = Router()

router.get('/', getBelongings)
router.get('/:id', getBelongingById)
router.post('/', createBelonging)
router.put('/:id', updateBelonging)
router.patch('/:id/status', toggleBelongingStatus)
router.delete('/:id', deleteBelonging)

export default router

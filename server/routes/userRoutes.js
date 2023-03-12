import { Router } from 'express'
import {
  getUsers,
  getUserById,
  saveUser,
  toggleUserStatus,
  deleteUser,
} from '../controllers/userController.js'

const router = Router()

router.get('/', getUsers)
router.get('/:id', getUserById)
router.post('/', saveUser)
router.put('/:id', saveUser)
router.patch('/:id/status', toggleUserStatus)
router.delete('/:id', deleteUser)

export default router

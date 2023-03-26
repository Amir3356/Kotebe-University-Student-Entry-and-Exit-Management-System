import { Router } from 'express'
import {
  getUsers,
  getUserById,
  saveUser,
  toggleUserStatus,
  deleteUser,
} from '../controllers/userController.js'
import { validateBody } from '../middleware/validationMiddleware.js'
import { userCreateSchema, userUpdateSchema } from '../models/userModel.js'

const router = Router()

router.get('/', getUsers)
router.get('/:id', getUserById)
router.post('/', validateBody(userCreateSchema), saveUser)
router.put('/:id', validateBody(userUpdateSchema), saveUser)
router.patch('/:id/status', toggleUserStatus)
router.delete('/:id', deleteUser)

export default router

import { Router } from 'express'
import { login, getCurrentUser } from '../controllers/authController.js'
import { validateRequiredFields } from '../middleware/validationMiddleware.js'

const router = Router()

// Route Layer: maps URL and HTTP method to controller with security validation
router.post('/login', validateRequiredFields(['username', 'role']), login)
router.get('/me', getCurrentUser)

export default router

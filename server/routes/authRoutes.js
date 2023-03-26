import { Router } from 'express'
import { login, getCurrentUser } from '../controllers/authController.js'
import { validateBody } from '../middleware/validationMiddleware.js'
import { loginSchema } from '../models/userModel.js'

const router = Router()

// Route Layer: maps URL and HTTP method to controller with Zod validation
router.post('/login', validateBody(loginSchema), login)
router.get('/me', getCurrentUser)

export default router

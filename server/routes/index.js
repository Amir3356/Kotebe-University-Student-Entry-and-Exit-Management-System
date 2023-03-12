import { Router } from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import belongingRoutes from './belongingRoutes.js'
import requestRoutes from './requestRoutes.js'
import gateRoutes from './gateRoutes.js'

const apiRouter = Router()

// Security guard: inspect authentication header for all API routes
apiRouter.use(authenticate)

apiRouter.use('/auth', authRoutes)
apiRouter.use('/users', userRoutes)
apiRouter.use('/belongings', belongingRoutes)
apiRouter.use('/exit-requests', requestRoutes)
apiRouter.use('/gate', gateRoutes)

export default apiRouter

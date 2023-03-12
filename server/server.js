import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './config/db.js'
import apiRouter from './routes/index.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Kotebe University Student Entry & Exit Management API',
    architecture: 'Monolithic (Layered Code Organization)',
    database: 'PostgreSQL (Managed by Knex.js)',
    version: '1.0.0',
    layers: ['routes', 'middleware', 'controllers', 'services', 'repositories', 'models'],
    endpoints: {
      auth: '/api/auth/login',
      users: '/api/users',
      belongings: '/api/belongings',
      exitRequests: '/api/exit-requests',
      gate: '/api/gate/logs',
      health: '/api/health',
    },
  })
})

// Health Check Route
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection()
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus.ok ? 'connected' : 'disconnected',
    databaseDetails: dbStatus.ok ? dbStatus.info : dbStatus.error,
  })
})

// Mount Central API Routes Layer
app.use('/api', apiRouter)

// 404 Handler Middleware
app.use(notFoundHandler)

// Central Error Handler Middleware
app.use(errorHandler)

// Start Server and check database connection
app.listen(PORT, async () => {
  console.log(`🚀 Monolithic Server running on http://localhost:${PORT}`)
  console.log(`📡 Checking PostgreSQL database connection...`)

  const conn = await testConnection()
  if (conn.ok) {
    console.log(`✅ Connected to PostgreSQL database "${conn.info.database}".`)
  } else {
    console.warn(`⚠️ Could not automatically connect to PostgreSQL: ${conn.error}`)
    console.info(`💡 Please verify PostgreSQL credentials in .env and run npm run db:migrate`)
  }
})

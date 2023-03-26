// Middleware: The security guard (JWT Authentication)
// Extracts and verifies JWT Bearer tokens directly using jsonwebtoken package.

import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/userRepository.js'
import { formatUser } from '../models/userModel.js'

const JWT_SECRET = process.env.JWT_SECRET || 'kotebe_default_jwt_secret_key_change_me'

export async function authenticate(req, res, next) {
  try {
    let token = null
    const authHeader = req.headers.authorization || req.headers['authorization']

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim()
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        const userRow = await userRepository.findById(decoded.id)

        if (!userRow || userRow.status !== 'active') {
          return res.status(401).json({
            ok: false,
            error: 'Unauthorized: Account is inactive or does not exist.',
          })
        }

        req.user = formatUser(userRow)
        return next()
      } catch (tokenErr) {
        return res.status(401).json({
          ok: false,
          error: 'Unauthorized: Invalid or expired token.',
        })
      }
    }

    // Fallback for user identifier header
    const fallbackId = req.headers['x-user-id'] || req.query.authUserId
    if (fallbackId) {
      const userRow = await userRepository.findById(fallbackId)
      if (userRow && userRow.status === 'active') {
        req.user = formatUser(userRow)
        return next()
      }
    }

    req.user = null
    next()
  } catch (err) {
    next(err)
  }
}

export default authenticate

// Middleware: The security guard (Authentication)
// Checks if the request contains an authenticated user identifier and verifies they are active.

import { userRepository } from '../repositories/userRepository.js'
import { formatUser } from '../models/userModel.js'

export async function authenticate(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.query.authUserId

    if (!userId) {
      // Allow unauthenticated requests through to controller or role check if not strictly required
      req.user = null
      return next()
    }

    const userRow = await userRepository.findById(userId)
    if (!userRow || userRow.status !== 'active') {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized: Account is inactive or does not exist.',
      })
    }

    req.user = formatUser(userRow)
    next()
  } catch (err) {
    next(err)
  }
}

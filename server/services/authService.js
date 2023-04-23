import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/userRepository.js'
import { formatUser } from '../models/userModel.js'

const JWT_SECRET = process.env.JWT_SECRET || 'kotebe_default_jwt_secret_key_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const authService = {
  async login({ username, password, role = null }) {
    if (!username || !username.trim()) {
      const err = new Error('Username is required.')
      err.statusCode = 400
      throw err
    }

    let userRow = await userRepository.findByUsernameOrStudentId(username, role)

    if (!userRow) {
      const err = new Error('Invalid username or password.')
      err.statusCode = 401
      throw err
    }

    if (userRow.role === 'admin') {
      const err = new Error('Admin role is disabled.')
      err.statusCode = 403
      throw err
    }

    if (userRow.status !== 'active') {
      const err = new Error('Your account is deactivated. Please contact an administrator.')
      err.statusCode = 403
      throw err
    }

    if (userRow.password) {
      if (!password || userRow.password !== password) {
        const err = new Error('Invalid username or password.')
        err.statusCode = 401
        throw err
      }
    }

    const user = formatUser(userRow)

    // Generate signed JWT token using jsonwebtoken package directly
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        studentId: user.studentId || null,
        gate: user.gate || null,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    return { user, token }
  },

  async getCurrentUser(id) {
    if (!id) throw new Error('User ID is required.')
    const userRow = await userRepository.findById(id)
    if (!userRow || userRow.status !== 'active') {
      throw new Error('User not found or inactive.')
    }
    return formatUser(userRow)
  },
}

export default authService

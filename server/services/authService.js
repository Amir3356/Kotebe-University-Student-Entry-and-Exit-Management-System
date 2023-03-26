import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/userRepository.js'
import { formatUser } from '../models/userModel.js'

const JWT_SECRET = process.env.JWT_SECRET || 'kotebe_default_jwt_secret_key_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const authService = {
  async login({ username, password, role }) {
    if (role === 'admin') {
      throw new Error('Admin role is disabled.')
    }

    let userRow = await userRepository.findByUsernameOrStudentId(username, role)

    // Development convenience fallback: first active user of that role if not found
    if (!userRow && process.env.NODE_ENV === 'development') {
      userRow = await userRepository.findFirstActiveByRole(role)
    }

    if (!userRow) {
      throw new Error(`No active ${role} account found matching "${username}".`)
    }

    if (password && userRow.password && userRow.password !== password && process.env.NODE_ENV !== 'development') {
      throw new Error('Invalid credentials.')
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

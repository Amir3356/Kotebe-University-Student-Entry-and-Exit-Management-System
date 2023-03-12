import { userRepository } from '../repositories/userRepository.js'
import { formatUser } from '../models/userModel.js'

export const authService = {
  async login({ username, password, role }) {
    if (!username || !role) {
      throw new Error('Username and role are required.')
    }

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

    return formatUser(userRow)
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

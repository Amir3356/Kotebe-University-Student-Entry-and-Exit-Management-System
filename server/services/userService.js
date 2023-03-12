import { userRepository } from '../repositories/userRepository.js'
import { formatUser } from '../models/userModel.js'

export const userService = {
  async getAllUsers(filters) {
    const rows = await userRepository.findAll(filters)
    return rows.map(formatUser)
  },

  async getUserById(id) {
    const row = await userRepository.findById(id)
    if (!row) throw new Error('User not found.')
    return formatUser(row)
  },

  async saveUser(data) {
    const { id, role, name, username, password, studentId } = data

    if (!name || !name.trim() || !username || !username.trim()) {
      throw new Error('Name and username are required.')
    }

    const cleanUsername = username.trim()

    // Validate duplicate username
    const usernameTaken = await userRepository.isUsernameTaken(cleanUsername, id)
    if (usernameTaken) {
      throw new Error(`Username "${cleanUsername}" is already taken.`)
    }

    // Validate duplicate studentId
    if (role === 'student' && studentId && studentId.trim()) {
      const cleanStudentId = studentId.trim().toUpperCase()
      const studentIdTaken = await userRepository.isStudentIdTaken(cleanStudentId, id)
      if (studentIdTaken) {
        throw new Error(`Student ID "${cleanStudentId}" already exists.`)
      }
    }

    if (id) {
      const updated = await userRepository.update(id, {
        ...data,
        name: name.trim(),
        username: cleanUsername,
        studentId: studentId ? studentId.trim().toUpperCase() : null,
      })
      if (!updated) throw new Error('User not found.')
      return formatUser(updated)
    } else {
      if (!password || !password.trim()) {
        throw new Error('Password is required for new accounts.')
      }

      const newId = `u-${role || 'stu'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const created = await userRepository.create({
        ...data,
        id: newId,
        name: name.trim(),
        username: cleanUsername,
        password: password.trim(),
        studentId: studentId ? studentId.trim().toUpperCase() : null,
      })
      return formatUser(created)
    }
  },

  async toggleUserStatus(id) {
    const user = await userRepository.findById(id)
    if (!user) throw new Error('User not found.')

    const nextStatus = user.status === 'active' ? 'inactive' : 'active'
    const updated = await userRepository.updateStatus(id, nextStatus)
    return formatUser(updated)
  },

  async deleteUser(id) {
    const deleted = await userRepository.delete(id)
    if (!deleted) throw new Error('User not found.')
    return { ok: true }
  },
}

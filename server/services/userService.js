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
    const cleanUsername = (username || '').trim()

    // Validate duplicate username
    if (cleanUsername) {
      const usernameTaken = await userRepository.isUsernameTaken(cleanUsername, id)
      if (usernameTaken) {
        throw new Error(`Username "${cleanUsername}" is already taken.`)
      }
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
      const existing = await userRepository.findById(id)
      if (existing) {
        // Merge partial updates onto the existing record so omitted fields are not
        // wiped, and only change the password when a new one is actually supplied.
        const keep = (val, prev) => (val === undefined || val === null || val === '' ? prev : val)
        const updated = await userRepository.update(id, {
          ...data,
          name: (keep(name, existing.name) || '').trim(),
          username: keep(cleanUsername, existing.username),
          password: password && String(password).trim() ? String(password).trim() : null,
          email: keep(data.email, existing.email),
          phone: keep(data.phone, existing.phone),
          studentId: studentId ? studentId.trim().toUpperCase() : existing.student_id,
          department: keep(data.department, existing.department),
          address: keep(data.address, existing.address),
          subcity: keep(data.subcity, existing.subcity),
          woreda: keep(data.woreda, existing.woreda),
          year: keep(data.year, existing.year),
          dorm: keep(data.dorm, existing.dorm),
          gate: keep(data.gate, existing.gate),
          assignedBlocks: keep(data.assignedBlocks, existing.assigned_blocks),
          status: keep(data.status, existing.status),
          approvalStatus: keep(data.approvalStatus, existing.approval_status),
        })
        return formatUser(updated)
      } else {
        const created = await userRepository.create({
          role: role || 'student',
          ...data,
          id,
          name: (name || '').trim(),
          username: cleanUsername,
          password: (password || 'password123').trim(),
          studentId: studentId ? studentId.trim().toUpperCase() : null,
        })
        return formatUser(created)
      }
    } else {
      const newId = `u-${role || 'stu'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const created = await userRepository.create({
        ...data,
        id: newId,
        name: (name || '').trim(),
        username: cleanUsername,
        password: (password || 'password123').trim(),
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
    await userRepository.delete(id)
    return { ok: true }
  },
}

export default userService

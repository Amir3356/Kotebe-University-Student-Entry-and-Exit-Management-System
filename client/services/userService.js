import { userApi } from '../api'
import { uid } from '../utils/format'
import { userSchema, USER_STATUSES } from '../models'

export const userService = {
  /**
   * Validates and prepares user data for persistence using Zod.
   */
  validateAndPrepareUser(user, existingUsers = []) {
    const parseResult = userSchema.safeParse(user)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      return { ok: false, error: firstIssue?.message || 'Validation error' }
    }

    const validData = parseResult.data

    const taken = existingUsers.some(
      (u) => u.id !== user.id && u.username.toLowerCase() === validData.username.toLowerCase(),
    )
    if (taken) {
      return { ok: false, error: `Username "${validData.username}" is already taken.` }
    }

    if (validData.role === 'student' && validData.studentId?.trim()) {
      const idTaken = existingUsers.some(
        (u) =>
          u.id !== user.id &&
          u.studentId &&
          u.studentId.trim().toLowerCase() === validData.studentId.trim().toLowerCase(),
      )
      if (idTaken) {
        return { ok: false, error: `Student ID "${validData.studentId}" already exists.` }
      }
    }

    return { ok: true, cleaned: { ...user, ...validData } }
  },

  /**
   * Persists user to backend and returns normalized record.
   */
  async saveUser(user, existingUsers = []) {
    const validation = this.validateAndPrepareUser(user, existingUsers)
    if (!validation.ok) return validation

    const { cleaned } = validation
    userApi.saveUser(cleaned).catch(() => {})

    if (user.id) {
      return { ok: true, isNew: false, user: cleaned }
    }

    const created = {
      ...cleaned,
      id: uid('u'),
      status: USER_STATUSES.ACTIVE,
      createdAt: new Date().toISOString(),
    }
    return { ok: true, isNew: true, user: created }
  },

  /**
   * Toggles status between active and inactive.
   */
  async toggleStatus(userId) {
    userApi.toggleUserStatus(userId).catch(() => {})
  },

  /**
   * Deletes user account.
   */
  async deleteUser(userId) {
    userApi.deleteUser(userId).catch(() => {})
  },
}

export default userService

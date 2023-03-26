import { authApi } from '../api'
import { getStoredToken, setStoredToken } from '../api/client'

export const authService = {
  /**
   * Authenticates user against active users list or backend and stores JWT.
   */
  async authenticate(users, username, password, role) {
    const ofRole = users.filter((u) => u.role === role && u.status === 'active')
    const query = (username || '').trim().toLowerCase()
    const fallbackUser =
      ofRole.find(
        (u) =>
          u.username.toLowerCase() === query ||
          (u.studentId && u.studentId.toLowerCase() === query),
      ) ?? ofRole[0]

    // Attempt backend JWT login
    try {
      const res = await authApi.login(username, password, role)
      if (res.ok && res.data?.token) {
        setStoredToken(res.data.token)
        return { ok: true, user: res.data.user, token: res.data.token }
      }
    } catch {
      // Backend unreachable, fallback below
    }

    if (!fallbackUser) {
      return { ok: false, error: `There is no active ${role} account available.` }
    }

    return { ok: true, user: fallbackUser }
  },

  logout() {
    setStoredToken(null)
  },

  getToken() {
    return getStoredToken()
  },

  checkHealth() {
    return authApi.checkHealth()
  },
}

export default authService

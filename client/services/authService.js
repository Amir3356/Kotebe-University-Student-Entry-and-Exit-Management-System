import { authApi } from '../api'
import { getStoredToken, setStoredToken } from '../api/client'

export const SEED_PROCTOR = {
  id: 'u-proctor-amir',
  name: 'Amir Siraj',
  username: 'Amir3356',
  password: 'AEHJSS36',
  role: 'proctor',
  status: 'active',
  createdAt: '2026-10-14T00:00:00.000Z',
}

export const authService = {
  /**
   * Authenticates user against active users list or backend and stores JWT.
   */
  async authenticate(users, username, password, role = null) {
    const cleanUsername = (username || '').trim()
    const query = cleanUsername.toLowerCase()
    if (!cleanUsername) {
      return { ok: false, error: 'Please enter a valid username.' }
    }

    // 1. Attempt backend JWT login first (authenticates against PostgreSQL and stores JWT)
    try {
      const res = await authApi.login(cleanUsername, password, role)
      if (res.ok && res.data?.token) {
        setStoredToken(res.data.token)
        return { ok: true, user: res.data.user, token: res.data.token }
      }
      if (!res.ok && res.error && !res.offline) {
        return { ok: false, error: res.error }
      }
    } catch {
      // Backend unreachable, fallback below
    }

    // 2. Direct match for Proctor Officer seed credential (offline fallback)
    if (query === 'amir3356' || query === 'amir siraj') {
      if (password && password !== 'AEHJSS36') {
        return { ok: false, error: 'Invalid password for Amir3356.' }
      }
      return { ok: true, user: SEED_PROCTOR }
    }

    // 3. Match against local active users list by username, studentId, or name (offline fallback)
    const localUser = (users || []).find(
      (u) =>
        u.status === 'active' &&
        (u.username?.toLowerCase() === query ||
          (u.studentId && u.studentId.toLowerCase() === query) ||
          (u.name && u.name.toLowerCase() === query)) &&
        (!role || u.role === role),
    )

    if (localUser) {
      if (password && localUser.password && localUser.password !== password) {
        return { ok: false, error: 'Invalid password.' }
      }
      return { ok: true, user: localUser }
    }

    return { ok: false, error: 'Invalid username or password.' }
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

import { useStore } from '../context/store'
import { authService } from '../services/authService'

/**
 * Custom hook for managing JWT authentication state and actions.
 */
export function useAuth() {
  const { currentUser, actions } = useStore()

  return {
    user: currentUser,
    token: authService.getToken(),
    isAuthenticated: Boolean(currentUser),
    role: currentUser?.role || null,
    login: actions.login,
    logout: actions.logout,
  }
}

export default useAuth

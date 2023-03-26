import { Navigate } from 'react-router-dom'
import { useStore } from '../context/store'
import Layout from '../layout/Layout'

/**
 * Route protection wrapper requiring an authenticated user with a specific role.
 */
export default function ProtectedRoute({ role }) {
  const { currentUser } = useStore()
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== role) return <Navigate to={`/${currentUser.role}`} replace />
  return <Layout />
}

import { Navigate } from 'react-router-dom'
import { useStore } from '../context/store'
import Layout from './Layout'

export default function RequireRole({ role }) {
  const { currentUser } = useStore()
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== role) return <Navigate to={`/${currentUser.role}`} replace />
  return <Layout />
}

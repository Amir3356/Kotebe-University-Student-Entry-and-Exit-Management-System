import { useMemo } from 'react'
import { useStore } from '../context/store'

/**
 * Custom hook for exit requests, filtered by role and status, with actions.
 */
export function useExitRequests() {
  const { exitRequests = [], currentUser, actions } = useStore()

  const myRequests = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'student') {
      return exitRequests.filter((r) => r.studentId === currentUser.id)
    }
    return exitRequests
  }, [exitRequests, currentUser])

  const pendingRequests = useMemo(() => {
    return exitRequests.filter((r) => r.status === 'pending')
  }, [exitRequests])

  const approvedRequests = useMemo(() => {
    return exitRequests.filter((r) => r.status === 'approved')
  }, [exitRequests])

  const counts = useMemo(
    () => ({
      pending: pendingRequests.length,
      approved: approvedRequests.length,
      total: exitRequests.length,
    }),
    [pendingRequests.length, approvedRequests.length, exitRequests.length],
  )

  return {
    requests: exitRequests,
    myRequests,
    pendingRequests,
    approvedRequests,
    counts,
    createExitRequest: actions.createExitRequest,
    reviewRequest: actions.reviewRequest,
    cancelRequest: actions.cancelRequest,
  }
}

export default useExitRequests

import { useMemo } from 'react'
import { useStore } from '../context/store'

/**
 * Custom hook for student belongings, status filtering, and actions.
 */
export function useBelongings() {
  const { belongings = [], currentUser, actions } = useStore()

  const myBelongings = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') return belongings
    return belongings.filter((b) => b.studentId === currentUser.id)
  }, [belongings, currentUser])

  const activeBelongings = useMemo(() => {
    return belongings.filter((b) => b.status === 'active' || b.status === 'on_campus')
  }, [belongings])

  return {
    belongings,
    myBelongings,
    activeBelongings,
    toggleBelongingStatus: actions.toggleBelongingStatus,
    deleteBelonging: actions.deleteBelonging,
  }
}

export default useBelongings

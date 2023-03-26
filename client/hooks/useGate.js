import { useStore } from '../context/store'

/**
 * Custom hook for gate logs and guard gate operations.
 */
export function useGate() {
  const { gateLogs = [], currentUser, actions } = useStore()

  return {
    gateLogs,
    currentGate: currentUser?.gate || 'Main Gate',
    recordEntry: actions.recordEntry,
    allowExit: actions.allowExit,
    denyExit: actions.denyExit,
  }
}

export default useGate

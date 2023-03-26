import { useStore } from '../context/store'

/**
 * Custom hook for accessing active toast notifications.
 */
export function useToasts() {
  const { toasts = [], dismissToast } = useStore()

  return {
    toasts,
    dismissToast,
  }
}

export default useToasts

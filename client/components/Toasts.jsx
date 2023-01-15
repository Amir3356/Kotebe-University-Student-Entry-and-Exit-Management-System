import { useStore } from '../context/store'
import Icon from './Icon'

const ICONS = { success: 'check', info: 'info', danger: 'alert' }

export default function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <Icon name={ICONS[toast.tone] ?? 'info'} size={16} />
          <span>{toast.message}</span>
          <button type="button" className="icon-btn" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

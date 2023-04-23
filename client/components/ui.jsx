import { useEffect } from 'react'
import Icon from './Icon'
import { initials } from '../utils/format'

export function PageHeader({ title, subtitle, actions, center = false }) {
  return (
    <header className={`page-header ${center ? 'page-header-center' : ''}`}>
      <div className={center ? 'text-center' : ''}>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, actions, children, className = '', flush = false }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      <div className={flush ? 'card-flush' : 'card-body'}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, icon, tone = 'neutral', hint }) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-icon">
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  )
}

const STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  completed: { label: 'Exited', tone: 'info' },
  on_campus: { label: 'Active', tone: 'success' },
  off_campus: { label: 'Inactive', tone: 'neutral' },
  entry: { label: 'Entry', tone: 'success' },
  exit: { label: 'Exit', tone: 'info' },
  denied: { label: 'Exit denied', tone: 'danger' },
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  approve: { label: 'Approved', tone: 'success' },
  reject: { label: 'Rejected', tone: 'danger' },
}

export function StatusBadge({ status }) {
  const meta = STATUS[status] ?? { label: status, tone: 'neutral' }
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
}

export function RoleBadge({ role }) {
  return <span className={`badge badge-role-${role}`}>{role[0].toUpperCase() + role.slice(1)}</span>
}

export function Avatar({ name, size = 'md' }) {
  return <span className={`avatar avatar-${size}`}>{initials(name)}</span>
}

export function EmptyState({ icon = 'box', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', autoFocus = false }) {
  return (
    <label className="search">
      <Icon name="search" size={16} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </label>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`tab ${value === tab.value ? 'active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, error, children, full = false }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Callout({ tone = 'info', icon, children }) {
  return (
    <div className={`callout callout-${tone}`}>
      <Icon name={icon ?? (tone === 'danger' || tone === 'warning' ? 'alert' : 'info')} size={18} />
      <div>{children}</div>
    </div>
  )
}

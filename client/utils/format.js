const LOCALE = 'en-GB'

export function formatDate(value) {
  if (!value) return '—'
  // Plain YYYY-MM-DD strings are parsed as local dates, not UTC.
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return `${formatDate(value)}, ${formatTime(value)}`
}

export function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} d ago`
  return formatDate(value)
}

export function isToday(value) {
  if (!value) return false
  return new Date(value).toDateString() === new Date().toDateString()
}

export function isWithinDays(value, days) {
  return Date.now() - new Date(value).getTime() <= days * 24 * 60 * 60 * 1000
}

export function todayISODate() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function itemCount(items) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}

export function matches(query, ...fields) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((field) => String(field ?? '').toLowerCase().includes(q))
}

export const ROLE_LABELS = {
  student: 'Student',
  guard: 'Guard',
  proctor: 'Proctor',
  admin: 'Admin',
}

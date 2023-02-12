import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreContext } from './store'
import { createMockData } from '../data'
import { uid } from '../utils/format'

// There is no backend: the mock data in data/ seeds the store, and every
// change is persisted to localStorage so it survives reloads and role switches.
const DATA_KEY = 'ku-seems:data:v1'
const SESSION_KEY = 'ku-seems:session'

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode); the app still works in memory.
  }
}

function loadData() {
  const raw = readStorage(DATA_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.belongings)) {
        parsed.belongings = parsed.belongings.map((b) => ({
          ...b,
          status: b.status === 'off_campus' || b.status === 'inactive' ? 'inactive' : 'active',
        }))
      }
      if (parsed && Array.isArray(parsed.users)) {
        const freshMap = Object.fromEntries(createMockData().users.map((u) => [u.id, u]))
        parsed.users = parsed.users.map((u) => {
          const fresh = freshMap[u.id]
          return fresh
            ? {
                ...u,
                address: u.address || fresh.address || 'Kotebe, Addis Ababa',
                subcity: u.subcity || fresh.subcity || 'Yeka',
                woreda: u.woreda || fresh.woreda || '08',
                approvalStatus: u.approvalStatus || fresh.approvalStatus || 'approve',
              }
            : u
        })
      }
      return parsed
    } catch {
      // fall through to fresh mock data
    }
  }
  return createMockData()
}

function snapshot(item) {
  return {
    category: item.category,
    description: item.description,
    serialNumber: item.serialNumber || '',
    quantity: Number(item.quantity) || 1,
  }
}

function nextRequestCode(requests) {
  const year = new Date().getFullYear()
  const max = requests.reduce((acc, r) => Math.max(acc, Number(r.code.split('-').pop()) || 0), 0)
  return `EXR-${year}-${String(max + 1).padStart(4, '0')}`
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const [sessionId, setSessionId] = useState(() => readStorage(SESSION_KEY))
  const [toasts, setToasts] = useState([])

  useEffect(() => writeStorage(DATA_KEY, JSON.stringify(data)), [data])
  useEffect(() => writeStorage(SESSION_KEY, sessionId), [sessionId])

  const currentUser = data.users.find((u) => u.id === sessionId && u.status === 'active') ?? null

  const notify = useCallback((message, tone = 'success') => {
    const id = uid('toast')
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800)
  }, [])

  const actions = useMemo(() => {
    const now = () => new Date().toISOString()

    return {
      // Testing mode: any username/password is accepted and the chosen role decides
      // which dashboard opens. If the username matches a mock account of that role,
      // that account is used; otherwise the first active mock account of the role.
      login(username, password, role) {
        const ofRole = data.users.filter((u) => u.role === role && u.status === 'active')
        const query = username.trim().toLowerCase()
        const user =
          ofRole.find(
            (u) =>
              u.username.toLowerCase() === query ||
              (u.studentId && u.studentId.toLowerCase() === query),
          ) ?? ofRole[0]
        if (!user) return { ok: false, error: `There is no active ${role} account in the mock data.` }
        setSessionId(user.id)
        return { ok: true, user }
      },

      logout() {
        setSessionId(null)
      },

      // Guard: record a student entering campus with belongings.
      recordEntry({ studentId, returningIds, newItems, note }) {
        const timestamp = now()
        const created = newItems.map((item) => ({
          id: uid('b'),
          studentId,
          category: item.category,
          description: item.description,
          brand: item.brand || '',
          serialNumber: item.serialNumber || '',
          color: item.color || '',
          status: 'active',
          registeredBy: currentUser.id,
          registeredAt: timestamp,
        }))
        const returning = data.belongings.filter((b) => returningIds.includes(b.id))
        const log = {
          id: uid('g'),
          type: 'entry',
          studentId,
          guardId: currentUser.id,
          gate: currentUser.gate || 'Main Gate',
          timestamp,
          requestId: null,
          note: note.trim(),
          items: [...returning, ...created].map(snapshot),
        }
        setData((prev) => ({
          ...prev,
          belongings: [
            ...prev.belongings.map((b) => (returningIds.includes(b.id) ? { ...b, status: 'active' } : b)),
            ...created,
          ],
          gateLogs: [log, ...prev.gateLogs],
        }))
        notify(`Entry recorded with ${log.items.length} item(s).`)
      },

      // Student: ask permission to leave with a list of belongings.
      createExitRequest({ reason, destination, departureDate, returnDate, items }) {
        const request = {
          id: uid('r'),
          code: nextRequestCode(data.exitRequests),
          studentId: currentUser.id,
          reason: reason.trim(),
          destination: destination.trim(),
          departureDate,
          returnDate,
          items: items.map((item) => ({ id: uid('ri'), belongingId: item.belongingId ?? null, ...snapshot(item) })),
          status: 'pending',
          createdAt: now(),
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: '',
          verifiedBy: null,
          exitedAt: null,
        }
        setData((prev) => ({ ...prev, exitRequests: [request, ...prev.exitRequests] }))
        notify(`Request ${request.code} submitted for proctor approval.`)
        return request
      },

      cancelRequest(requestId) {
        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId && r.status === 'pending' ? { ...r, status: 'cancelled' } : r,
          ),
        }))
        notify('Request cancelled.', 'info')
      },

      // Proctor: approve or reject a departure request.
      reviewRequest(requestId, decision, note) {
        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: decision, reviewedBy: currentUser.id, reviewedAt: now(), reviewNote: note.trim() }
              : r,
          ),
        }))
        notify(decision === 'approved' ? 'Request approved.' : 'Request rejected.', decision === 'approved' ? 'success' : 'info')
      },

      // Guard: items matched the approved request, let the student leave.
      allowExit(requestId, note) {
        const request = data.exitRequests.find((r) => r.id === requestId)
        if (!request) return
        const timestamp = now()
        const leavingIds = request.items.map((i) => i.belongingId).filter(Boolean)
        const log = {
          id: uid('g'),
          type: 'exit',
          studentId: request.studentId,
          guardId: currentUser.id,
          gate: currentUser.gate || 'Main Gate',
          timestamp,
          requestId,
          note: note.trim(),
          items: request.items.map(snapshot),
        }
        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'completed', verifiedBy: currentUser.id, exitedAt: timestamp } : r,
          ),
          belongings: prev.belongings.map((b) => (leavingIds.includes(b.id) ? { ...b, status: 'inactive' } : b)),
          gateLogs: [log, ...prev.gateLogs],
        }))
        notify(`Exit allowed for ${request.code}.`)
      },

      // Guard: items did not match; the request stays approved so the student can retry.
      denyExit(requestId, reason) {
        const request = data.exitRequests.find((r) => r.id === requestId)
        if (!request) return
        const log = {
          id: uid('g'),
          type: 'denied',
          studentId: request.studentId,
          guardId: currentUser.id,
          gate: currentUser.gate || 'Main Gate',
          timestamp: now(),
          requestId,
          note: reason.trim(),
          items: request.items.map(snapshot),
        }
        setData((prev) => ({ ...prev, gateLogs: [log, ...prev.gateLogs] }))
        notify('Exit denied and logged.', 'danger')
      },

      // Admin: create or update an account.
      saveUser(user) {
        const username = user.username.trim()
        const taken = data.users.some((u) => u.id !== user.id && u.username.toLowerCase() === username.toLowerCase())
        if (taken) return { ok: false, error: `Username "${username}" is already taken.` }
        if (user.role === 'student' && user.studentId?.trim()) {
          const idTaken = data.users.some((u) => u.id !== user.id && u.studentId && u.studentId.trim().toLowerCase() === user.studentId.trim().toLowerCase())
          if (idTaken) return { ok: false, error: `Student ID ${user.studentId} already exists.` }
        }
        const cleaned = { ...user, username, name: user.name.trim() }
        if (user.id) {
          setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === user.id ? { ...u, ...cleaned } : u)) }))
          notify('Account updated.')
        } else {
          const created = { ...cleaned, id: uid('u'), status: 'active', createdAt: now() }
          setData((prev) => ({ ...prev, users: [...prev.users, created] }))
          notify('Account created.')
        }
        return { ok: true }
      },

      toggleUserStatus(userId) {
        const user = data.users.find((u) => u.id === userId)
        const status = user.status === 'active' ? 'inactive' : 'active'
        setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, status } : u)) }))
        notify(`${user.name} ${status === 'active' ? 'activated' : 'deactivated'}.`, 'info')
      },

      deleteUser(userId) {
        setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== userId) }))
        notify('Account deleted.', 'info')
      },

      deleteBelonging(belongingId) {
        setData((prev) => ({ ...prev, belongings: prev.belongings.filter((b) => b.id !== belongingId) }))
        notify('Belonging record removed.', 'info')
      },

      toggleBelongingStatus(belongingId) {
        const item = data.belongings.find((b) => b.id === belongingId)
        if (!item) return
        const isCurrentActive = item.status === 'active' || item.status === 'on_campus'
        const nextStatus = isCurrentActive ? 'inactive' : 'active'
        setData((prev) => ({
          ...prev,
          belongings: prev.belongings.map((b) => (b.id === belongingId ? { ...b, status: nextStatus } : b)),
        }))
        notify(`${item.description || item.category} set to ${nextStatus}.`, 'info')
      },

      resetDemoData() {
        setData(createMockData())
        notify('Demo data restored.', 'info')
      },
    }
  }, [data, currentUser, notify])

  const value = useMemo(
    () => ({ ...data, currentUser, actions, toasts, dismissToast: (id) => setToasts((l) => l.filter((t) => t.id !== id)) }),
    [data, currentUser, actions, toasts],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

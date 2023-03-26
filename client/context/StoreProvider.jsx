import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreContext } from './store'
import { createMockData } from '../data'
import { uid } from '../utils/format'
import { api } from '../api'
import {
  authService,
  userService,
  belongingService,
  requestService,
  gateService,
} from '../services'

const DATA_KEY = 'ku-seems:data:v3'
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
        parsed.users = parsed.users
          .filter((u) => u.role !== 'admin')
          .map((u) => {
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

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const [sessionId, setSessionId] = useState(() => readStorage(SESSION_KEY))
  const [toasts, setToasts] = useState([])

  useEffect(() => writeStorage(DATA_KEY, JSON.stringify(data)), [data])
  useEffect(() => writeStorage(SESSION_KEY, sessionId), [sessionId])

  useEffect(() => {
    async function syncFromBackend() {
      try {
        const [usersRes, belongingsRes, requestsRes, logsRes] = await Promise.all([
          api.getUsers(),
          api.getBelongings(),
          api.getExitRequests(),
          api.getGateLogs(),
        ])
        if (usersRes.ok && belongingsRes.ok && requestsRes.ok && logsRes.ok) {
          setData({
            users: usersRes.data,
            belongings: belongingsRes.data,
            exitRequests: requestsRes.data,
            gateLogs: logsRes.data,
          })
        }
      } catch {
        // Fallback to local storage if server is unreachable
      }
    }
    syncFromBackend()
  }, [])

  const currentUser = data.users.find((u) => u.id === sessionId && u.status === 'active' && u.role !== 'admin') ?? null

  const notify = useCallback((message, tone = 'success') => {
    const id = uid('toast')
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800)
  }, [])

  const actions = useMemo(() => {
    const now = () => new Date().toISOString()

    return {
      // JWT Authentication
      async login(username, password, role) {
        const res = await authService.authenticate(data.users, username, password, role)
        if (!res.ok) return res
        setSessionId(res.user.id)
        return { ok: true, user: res.user }
      },

      logout() {
        authService.logout()
        setSessionId(null)
      },

      // Guard: record a student entering campus with belongings.
      recordEntry({ studentId, returningIds = [], newItems = [], note = '' }) {
        const created = belongingService.createBelongingItems(newItems, studentId, currentUser?.id)
        const returning = data.belongings.filter((b) => returningIds.includes(b.id))
        const log = gateService.processEntry({
          studentId,
          guardId: currentUser?.id,
          gate: currentUser?.gate || 'Main Gate',
          returningIds,
          createdItems: [...returning, ...created],
          note,
        })

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
      createExitRequest({ reason, destination, departureDate, returnDate, items, studentId }) {
        const targetStudentId = studentId ?? currentUser?.id
        const request = requestService.buildExitRequest({
          reason,
          destination,
          departureDate,
          returnDate,
          items,
          studentId: targetStudentId,
          existingRequests: data.exitRequests,
        })

        setData((prev) => ({ ...prev, exitRequests: [request, ...prev.exitRequests] }))
        notify(`Request ${request.code} submitted for proctor approval.`)
        return request
      },

      cancelRequest(requestId) {
        requestService.cancelRequest(requestId)
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
        requestService.reviewRequest(requestId, decision, note, currentUser?.id)
        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: decision, reviewedBy: currentUser?.id, reviewedAt: now(), reviewNote: note.trim() }
              : r,
          ),
        }))
        notify(decision === 'approved' ? 'Request approved.' : 'Request rejected.', decision === 'approved' ? 'success' : 'info')
      },

      // Guard: items matched the approved request, let the student leave.
      allowExit(requestId, note) {
        const request = data.exitRequests.find((r) => r.id === requestId)
        if (!request) return
        const { log, timestamp } = gateService.processExit({
          request,
          guardId: currentUser?.id,
          gate: currentUser?.gate || 'Main Gate',
          note,
        })
        const leavingIds = request.items.map((i) => i.belongingId).filter(Boolean)

        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'completed', verifiedBy: currentUser?.id, exitedAt: timestamp } : r,
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
        const log = gateService.processDenial({
          request,
          guardId: currentUser?.id,
          gate: currentUser?.gate || 'Main Gate',
          reason,
        })
        setData((prev) => ({ ...prev, gateLogs: [log, ...prev.gateLogs] }))
        notify('Exit denied and logged.', 'danger')
      },

      // Proctor: create or update an account.
      saveUser(user, { silent = false } = {}) {
        const validation = userService.validateAndPrepareUser(user, data.users)
        if (!validation.ok) return validation

        const { cleaned } = validation
        api.saveUser(cleaned).catch(() => {})

        if (user.id) {
          setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === user.id ? { ...u, ...cleaned } : u)) }))
          if (!silent) notify('Account updated.')
          return { ok: true, user: cleaned }
        }

        const created = { ...cleaned, id: uid('u'), status: 'active', createdAt: now() }
        setData((prev) => ({ ...prev, users: [...prev.users, created] }))
        if (!silent) notify('Account created.')
        return { ok: true, user: created }
      },

      toggleUserStatus(userId) {
        const user = data.users.find((u) => u.id === userId)
        if (!user) return
        const nextStatus = user.status === 'active' ? 'inactive' : 'active'
        userService.toggleStatus(userId)
        setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)) }))
        notify(`${user.name} ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`, 'info')
      },

      deleteUser(userId) {
        userService.deleteUser(userId)
        setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== userId) }))
        notify('Account deleted.', 'info')
      },

      deleteBelonging(belongingId) {
        belongingService.deleteBelonging(belongingId)
        setData((prev) => ({ ...prev, belongings: prev.belongings.filter((b) => b.id !== belongingId) }))
        notify('Belonging record removed.', 'info')
      },

      toggleBelongingStatus(belongingId) {
        const item = data.belongings.find((b) => b.id === belongingId)
        if (!item) return
        const isCurrentActive = item.status === 'active' || item.status === 'on_campus'
        const nextStatus = isCurrentActive ? 'inactive' : 'active'
        belongingService.toggleStatus(belongingId)
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

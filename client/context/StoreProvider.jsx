import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreContext } from './store'
import { uid } from '../utils/format'
import { api } from '../api'
import {
  authService,
  userService,
  belongingService,
  requestService,
  gateService,
} from '../services'

const DATA_KEY = 'ku-seems:data:v5'
const SESSION_KEY = 'ku-seems:session'
const AUTH_USER_KEY = 'ku-seems:auth-user'

// Clear any legacy localStorage keys that may hold stale mock data
const LEGACY_KEYS = [
  'ku-seems:data',
  'ku-seems:data:v1',
  'ku-seems:data:v2',
  'ku-seems:data:v3',
  'ku-seems:data:v4',
]

try {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
} catch {
  // Storage unavailable in private browsing
}

const MOCK_USER_IDS = new Set([
  'u-stu-1', 'u-stu-2', 'u-stu-3', 'u-stu-4', 'u-stu-5', 'u-stu-6', 'u-stu-7', 'u-stu-8',
  'u-guard-1', 'u-guard-2',
  'u-proctor-1', 'u-proctor-2',
])

const MOCK_USERNAMES = new Set([
  'student', 'hana', 'yonas', 'meron', 'bereket', 'liya', 'natnael', 'eden',
  'guard', 'kebede',
  'proctor', 'almaz',
])

function isMockUser(u) {
  if (!u) return false
  if (MOCK_USER_IDS.has(u.id)) return true
  if (u.username && MOCK_USERNAMES.has(u.username.toLowerCase())) return true
  return false
}

export const SEED_PROCTOR = {
  id: 'u-proctor-amir',
  name: 'Amir Siraj',
  username: 'Amir3356',
  password: 'AEHJSS36',
  role: 'proctor',
  status: 'active',
  createdAt: '2026-10-14T00:00:00.000Z',
}

const EMPTY_DATA = {
  users: [SEED_PROCTOR],
  belongings: [],
  exitRequests: [],
  gateLogs: [],
}

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
      const validUsers = Array.isArray(parsed?.users)
        ? parsed.users.filter((u) => u.role !== 'admin' && !isMockUser(u))
        : []

      const hasAmir = validUsers.some(
        (u) => u.username?.toLowerCase() === 'amir3356' || u.id === SEED_PROCTOR.id,
      )
      const users = hasAmir ? validUsers : [SEED_PROCTOR, ...validUsers]

      return {
        users,
        belongings: Array.isArray(parsed?.belongings)
          ? parsed.belongings.filter((b) => !b.id?.startsWith('b-') && !MOCK_USER_IDS.has(b.studentId))
          : [],
        exitRequests: Array.isArray(parsed?.exitRequests)
          ? parsed.exitRequests.filter((r) => !r.id?.startsWith('r-') && !MOCK_USER_IDS.has(r.studentId))
          : [],
        gateLogs: Array.isArray(parsed?.gateLogs)
          ? parsed.gateLogs.filter((g) => !g.id?.startsWith('g-') && !MOCK_USER_IDS.has(g.studentId))
          : [],
      }
    } catch {
      // Storage corrupted, fall back to empty
    }
  }
  return EMPTY_DATA
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const [sessionId, setSessionId] = useState(() => readStorage(SESSION_KEY) || SEED_PROCTOR.id)
  const [currentUser, setCurrentUser] = useState(() => {
    const rawStored = readStorage(AUTH_USER_KEY)
    if (rawStored) {
      try {
        const u = JSON.parse(rawStored)
        if (u && !isMockUser(u)) return u
      } catch {}
    }
    const initial = loadData()
    const found = initial.users.find((u) => u.id === sessionId && u.status === 'active' && u.role !== 'admin')
    if (found) return found

    return SEED_PROCTOR
  })
  const [toasts, setToasts] = useState([])

  useEffect(() => writeStorage(DATA_KEY, JSON.stringify(data)), [data])
  useEffect(() => writeStorage(SESSION_KEY, sessionId), [sessionId])
  useEffect(() => {
    if (currentUser) writeStorage(AUTH_USER_KEY, JSON.stringify(currentUser))
    else writeStorage(AUTH_USER_KEY, null)
  }, [currentUser])

  useEffect(() => {
    let isMounted = true
    async function syncFromBackend() {
      try {
        const [usersRes, belongingsRes, requestsRes, logsRes] = await Promise.allSettled([
          api.getUsers(),
          api.getBelongings(),
          api.getExitRequests(),
          api.getGateLogs(),
        ])
        if (!isMounted) return

        setData((prev) => {
          const next = { ...prev }
          if (usersRes.status === 'fulfilled' && usersRes.value?.ok && Array.isArray(usersRes.value.data)) {
            next.users = usersRes.value.data.filter((u) => u.role !== 'admin' && !isMockUser(u))
          }
          if (belongingsRes.status === 'fulfilled' && belongingsRes.value?.ok && Array.isArray(belongingsRes.value.data)) {
            next.belongings = belongingsRes.value.data.filter((b) => !isMockUser({ id: b.studentId }))
          }
          if (requestsRes.status === 'fulfilled' && requestsRes.value?.ok && Array.isArray(requestsRes.value.data)) {
            next.exitRequests = requestsRes.value.data.filter((r) => !isMockUser({ id: r.studentId }))
          }
          if (logsRes.status === 'fulfilled' && logsRes.value?.ok && Array.isArray(logsRes.value.data)) {
            next.gateLogs = logsRes.value.data.filter((g) => !isMockUser({ id: g.studentId }))
          }
          return next
        })
      } catch {
        // Fallback to local storage if server is unreachable
      }
    }
    syncFromBackend()
    return () => {
      isMounted = false
    }
  }, [])

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
        if (res.user) {
          setCurrentUser(res.user)
          setSessionId(res.user.id)
        }
        return { ok: true, user: res.user }
      },

      logout() {
        authService.logout()
        setSessionId(null)
        setCurrentUser(null)
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

        const { cleaned, isReplayed } = validation

        // If this is a replay of an already processed submission in the local store
        if (isReplayed) {
          return { ok: true, user: cleaned, isReplayed: true }
        }

        // Fire API request with idempotency protection
        api.saveUser(cleaned).then((res) => {
          if (res?.data?.user) {
            const backendUser = res.data.user
            setData((prev) => ({
              ...prev,
              users: prev.users.map((u) =>
                (cleaned.idempotencyKey && u.idempotencyKey === cleaned.idempotencyKey) || u.id === (cleaned.id || backendUser.id)
                  ? { ...u, ...backendUser }
                  : u,
              ),
            }))
          }
        }).catch(() => {})

        if (user.id) {
          setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === user.id ? { ...u, ...cleaned } : u)) }))
          if (currentUser?.id === user.id) {
            setCurrentUser((prev) => ({ ...prev, ...cleaned }))
          }
          if (!silent) notify('Account updated.')
          return { ok: true, user: cleaned }
        }

        const created = { ...cleaned, id: uid('u'), status: 'active', createdAt: now() }
        setData((prev) => {
          const exists = prev.users.some(
            (u) =>
              (cleaned.idempotencyKey && u.idempotencyKey && u.idempotencyKey === cleaned.idempotencyKey) ||
              u.id === created.id ||
              u.username.toLowerCase() === created.username.toLowerCase(),
          )
          if (exists) {
            return {
              ...prev,
              users: prev.users.map((u) =>
                (cleaned.idempotencyKey && u.idempotencyKey === cleaned.idempotencyKey) || u.id === created.id
                  ? { ...u, ...created }
                  : u,
              ),
            }
          }
          return { ...prev, users: [...prev.users, created] }
        })
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

      resetData() {
        setData(EMPTY_DATA)
        writeStorage(DATA_KEY, JSON.stringify(EMPTY_DATA))
        notify('Data cache cleared.', 'info')
      },

      resetDemoData() {
        setData(EMPTY_DATA)
        writeStorage(DATA_KEY, JSON.stringify(EMPTY_DATA))
        notify('Data cache cleared.', 'info')
      },
    }
  }, [data, currentUser, notify])

  const value = useMemo(
    () => ({ ...data, currentUser, actions, toasts, dismissToast: (id) => setToasts((l) => l.filter((t) => t.id !== id)) }),
    [data, currentUser, actions, toasts],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

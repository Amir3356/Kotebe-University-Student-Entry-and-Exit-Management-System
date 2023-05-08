import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreContext } from './store'
import { uid } from '../utils/format'
import { api } from '../api'
import { getSocket } from '../api/socket'
import {
  authService,
  userService,
  belongingService,
  requestService,
  gateService,
} from '../services'

const DATA_KEY = 'ku-seems:data:v7'
const SESSION_KEY = 'ku-seems:session'
const AUTH_USER_KEY = 'ku-seems:auth-user'

// Clear any legacy localStorage keys that may hold stale mock data
const LEGACY_KEYS = [
  'ku-seems:data',
  'ku-seems:data:v1',
  'ku-seems:data:v2',
  'ku-seems:data:v3',
  'ku-seems:data:v4',
  'ku-seems:data:v5',
  'ku-seems:data:v6',
]

try {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
} catch {
  // Storage unavailable in private browsing
}

const MOCK_USER_IDS = new Set([
  'u-guard-1', 'u-guard-2',
  'u-proctor-1', 'u-proctor-2',
])

const MOCK_USERNAMES = new Set([
  'guard', 'kebede',
  'proctor', 'almaz',
])

function isMockUser() {
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
        ? parsed.users.filter((u) => u.role !== 'admin')
        : []

      const hasAmir = validUsers.some(
        (u) => u.username?.toLowerCase() === 'amir3356' || u.id === SEED_PROCTOR.id,
      )
      const users = hasAmir ? validUsers : [SEED_PROCTOR, ...validUsers]

      return {
        users,
        belongings: Array.isArray(parsed?.belongings) ? parsed.belongings : [],
        exitRequests: Array.isArray(parsed?.exitRequests) ? parsed.exitRequests : [],
        gateLogs: Array.isArray(parsed?.gateLogs) ? parsed.gateLogs : [],
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

  const notify = useCallback((message, tone = 'success') => {
    const id = uid('toast')
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800)
  }, [])

  useEffect(() => writeStorage(DATA_KEY, JSON.stringify(data)), [data])
  useEffect(() => writeStorage(SESSION_KEY, sessionId), [sessionId])
  useEffect(() => {
    if (currentUser) writeStorage(AUTH_USER_KEY, JSON.stringify(currentUser))
    else writeStorage(AUTH_USER_KEY, null)
  }, [currentUser])

  const syncFromBackend = useCallback(async () => {
    try {
      const [usersRes, belongingsRes, requestsRes, logsRes] = await Promise.allSettled([
        api.getUsers(),
        api.getBelongings(),
        api.getExitRequests(),
        api.getGateLogs(),
      ])

      setData((prev) => {
        const next = { ...prev }
        if (usersRes.status === 'fulfilled' && usersRes.value?.ok && Array.isArray(usersRes.value.data)) {
          const backendUsers = usersRes.value.data.filter((u) => u.role !== 'admin')
          const backendIds = new Set(backendUsers.map((u) => u.id))
          const localOnly = (prev.users || []).filter((u) => !backendIds.has(u.id))
          next.users = [...backendUsers, ...localOnly]
          if (currentUser && !next.users.some((u) => u.id === currentUser.id)) {
            next.users = [currentUser, ...next.users]
          }
        }
        if (belongingsRes.status === 'fulfilled' && belongingsRes.value?.ok && Array.isArray(belongingsRes.value.data)) {
          next.belongings = belongingsRes.value.data
        }
        if (requestsRes.status === 'fulfilled' && requestsRes.value?.ok && Array.isArray(requestsRes.value.data)) {
          const backendReqs = requestsRes.value.data
          const backendReqIds = new Set(backendReqs.map((r) => r.id))
          const backendCodes = new Set(backendReqs.map((r) => r.code).filter(Boolean))
          const localOnly = (prev.exitRequests || []).filter(
            (r) => !backendReqIds.has(r.id) && (!r.code || !backendCodes.has(r.code)),
          )
          next.exitRequests = [...backendReqs, ...localOnly]
        }
        if (logsRes.status === 'fulfilled' && logsRes.value?.ok && Array.isArray(logsRes.value.data)) {
          next.gateLogs = logsRes.value.data
        }
        return next
      })
    } catch {
      // Fallback to local storage if server is unreachable
    }
  }, [currentUser])

  // Sync initial state on mount, on window focus, and background fallback heartbeat
  useEffect(() => {
    syncFromBackend()
    const interval = setInterval(syncFromBackend, 30000)
    const onFocus = () => syncFromBackend()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [syncFromBackend])

  // Real-time WebSocket event listeners
  useEffect(() => {
    const socket = getSocket()

    function handleRequestReviewed(payload) {
      if (!payload) return
      const { requestId, decision, note, request, studentId } = payload
      const targetReq = request || {}
      const targetCode = targetReq.code
      const targetStudent = studentId || targetReq.studentId

      setData((prev) => {
        const exists = prev.exitRequests.some(
          (r) => r.id === requestId || (targetCode && r.code === targetCode),
        )
        const updatedRequests = exists
          ? prev.exitRequests.map((r) =>
              r.id === requestId || (targetCode && r.code === targetCode)
                ? {
                    ...r,
                    ...targetReq,
                    status: decision,
                    reviewNote: note || targetReq.reviewNote || r.reviewNote,
                    reviewedBy: targetReq.reviewedBy || r.reviewedBy,
                    reviewedAt: targetReq.reviewedAt || r.reviewedAt || new Date().toISOString(),
                    student: {
                      ...(r.student || {}),
                      ...(targetReq.student || {}),
                    },
                  }
                : r,
            )
          : [
              {
                ...targetReq,
                id: requestId,
                status: decision,
                reviewNote: note || targetReq.reviewNote || '',
                reviewedAt: targetReq.reviewedAt || new Date().toISOString(),
              },
              ...prev.exitRequests,
            ]

        let nextUsers = prev.users.map((u) =>
          u.id === targetStudent ||
          (u.studentId && targetStudent && u.studentId.toLowerCase() === targetStudent.toLowerCase())
            ? { ...u, approvalStatus: decision === 'approved' ? 'approved' : 'rejected' }
            : u,
        )

        if (targetReq.student && targetReq.student.name) {
          const s = targetReq.student
          const studentExists = nextUsers.some(
            (u) =>
              u.id === targetStudent ||
              (u.studentId && s.studentId && u.studentId.trim().toLowerCase() === s.studentId.trim().toLowerCase()),
          )
          if (!studentExists) {
            nextUsers = [
              ...nextUsers,
              {
                id: targetStudent,
                role: 'student',
                name: s.name,
                studentId: s.studentId,
                department: s.department,
                phone: s.phone,
                address: s.address,
                subcity: s.subcity,
                woreda: s.woreda,
                status: 'active',
                approvalStatus: decision === 'approved' ? 'approved' : 'rejected',
              },
            ]
          }
        }

        return {
          ...prev,
          exitRequests: updatedRequests,
          users: nextUsers,
        }
      })

      if (
        currentUser?.id === targetStudent ||
        (currentUser?.studentId && targetStudent && currentUser.studentId.toLowerCase() === targetStudent.toLowerCase())
      ) {
        setCurrentUser((prev) => ({ ...prev, approvalStatus: decision === 'approved' ? 'approved' : 'rejected' }))
        notify(
          decision === 'approved'
            ? 'Your leave request was approved by the Proctor!'
            : 'Your leave request was rejected by the Proctor.',
          decision === 'approved' ? 'success' : 'danger',
        )
      } else if (currentUser?.role === 'guard') {
        notify(
          `Leave request ${targetCode ? targetCode + ' ' : ''}was ${decision} by Proctor.`,
          decision === 'approved' ? 'success' : 'info',
        )
      }
    }

    function handleRequestCreated(newReq) {
      if (!newReq) return
      setData((prev) => {
        const exists = prev.exitRequests.some((r) => r.id === newReq.id || (r.code && r.code === newReq.code))
        const nextRequests = exists
          ? prev.exitRequests.map((r) => (r.id === newReq.id || r.code === newReq.code ? { ...r, ...newReq } : r))
          : [newReq, ...prev.exitRequests]

        let nextUsers = prev.users
        if (newReq.student?.name || newReq.student?.studentId) {
          const s = newReq.student
          const studentExists = prev.users.some(
            (u) =>
              u.id === newReq.studentId ||
              (u.studentId && s.studentId && u.studentId.trim().toLowerCase() === s.studentId.trim().toLowerCase()),
          )
          if (studentExists) {
            nextUsers = prev.users.map((u) =>
              u.id === newReq.studentId ||
              (u.studentId && s.studentId && u.studentId.trim().toLowerCase() === s.studentId.trim().toLowerCase())
                ? { ...u, ...s }
                : u,
            )
          } else {
            nextUsers = [
              ...prev.users,
              {
                id: newReq.studentId,
                role: 'student',
                name: s.name || 'Student',
                studentId: s.studentId,
                department: s.department,
                phone: s.phone,
                address: s.address,
                subcity: s.subcity,
                woreda: s.woreda,
                status: 'active',
                approvalStatus: 'pending',
              },
            ]
          }
        }

        return {
          ...prev,
          exitRequests: nextRequests,
          users: nextUsers,
        }
      })

      if (currentUser?.role === 'proctor') {
        notify(`New student leave request: ${newReq.code || ''}`, 'info')
      } else if (currentUser?.role === 'guard') {
        notify(`New leave request pending audit: ${newReq.code || ''}`, 'info')
      }
    }

    function handleRequestCancelled(payload) {
      if (!payload?.requestId) return
      setData((prev) => ({
        ...prev,
        exitRequests: prev.exitRequests.map((r) => (r.id === payload.requestId ? { ...r, status: 'cancelled' } : r)),
      }))
    }

    function handleUserUpdated(updatedUser) {
      if (!updatedUser) return
      setData((prev) => {
        const exists = prev.users.some(
          (u) =>
            u.id === updatedUser.id ||
            (u.studentId && updatedUser.studentId && u.studentId.trim().toLowerCase() === updatedUser.studentId.trim().toLowerCase()) ||
            (u.username && updatedUser.username && u.username.toLowerCase() === updatedUser.username.toLowerCase()),
        )
        return {
          ...prev,
          users: exists
            ? prev.users.map((u) =>
                u.id === updatedUser.id ||
                (u.studentId && updatedUser.studentId && u.studentId.trim().toLowerCase() === updatedUser.studentId.trim().toLowerCase()) ||
                (u.username && updatedUser.username && u.username.toLowerCase() === updatedUser.username.toLowerCase())
                  ? { ...u, ...updatedUser }
                  : u,
              )
            : [...prev.users, updatedUser],
        }
      })
      if (
        currentUser?.id === updatedUser.id ||
        (currentUser?.username && updatedUser.username && currentUser.username.toLowerCase() === updatedUser.username.toLowerCase())
      ) {
        setCurrentUser((prev) => ({ ...prev, ...updatedUser }))
      }
    }

    function handleUserDeleted(payload) {
      if (!payload?.id) return
      setData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== payload.id),
      }))
    }

    function handleRequestDeleted(payload) {
      if (!payload?.id) return
      setData((prev) => ({
        ...prev,
        exitRequests: prev.exitRequests.filter((r) => r.id !== payload.id),
      }))
    }

    function handleGateActivity(log) {
      if (!log) return
      setData((prev) => ({
        ...prev,
        gateLogs: [log, ...prev.gateLogs.filter((l) => l.id !== log.id)],
        exitRequests:
          log.requestId && log.type === 'exit'
            ? prev.exitRequests.map((r) =>
                r.id === log.requestId || r.code === log.requestId
                  ? { ...r, status: 'completed', exitedAt: log.timestamp, verifiedBy: log.guardId }
                  : r,
              )
            : prev.exitRequests,
      }))
    }

    socket.on('request:reviewed', handleRequestReviewed)
    socket.on('request:created', handleRequestCreated)
    socket.on('request:cancelled', handleRequestCancelled)
    socket.on('request:deleted', handleRequestDeleted)
    socket.on('user:updated', handleUserUpdated)
    socket.on('user:deleted', handleUserDeleted)
    socket.on('gate:activity', handleGateActivity)

    return () => {
      socket.off('request:reviewed', handleRequestReviewed)
      socket.off('request:created', handleRequestCreated)
      socket.off('request:cancelled', handleRequestCancelled)
      socket.off('request:deleted', handleRequestDeleted)
      socket.off('user:updated', handleUserUpdated)
      socket.off('user:deleted', handleUserDeleted)
      socket.off('gate:activity', handleGateActivity)
    }
  }, [currentUser, notify])

  // Cross-tab storage synchronization
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === DATA_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed && typeof parsed === 'object') {
            setData((prev) => ({
              ...prev,
              users: Array.isArray(parsed.users) ? parsed.users : prev.users,
              belongings: Array.isArray(parsed.belongings) ? parsed.belongings : prev.belongings,
              exitRequests: Array.isArray(parsed.exitRequests) ? parsed.exitRequests : prev.exitRequests,
              gateLogs: Array.isArray(parsed.gateLogs) ? parsed.gateLogs : prev.gateLogs,
            }))
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
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
          syncFromBackend()
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
      async createExitRequest({ reason, destination, departureDate, returnDate, items, studentId, student }) {
        const targetStudentId = studentId ?? currentUser?.id
        const studentInfo =
          student ||
          (targetStudentId
            ? data.users.find(
                (u) =>
                  u.id === targetStudentId ||
                  (u.studentId && u.studentId.trim().toLowerCase() === String(targetStudentId).trim().toLowerCase()),
              )
            : null) ||
          (currentUser?.role === 'student' ? currentUser : null)

        const request = requestService.buildExitRequest({
          reason,
          destination,
          departureDate,
          returnDate,
          items,
          studentId: targetStudentId,
          student: studentInfo
            ? {
                name: studentInfo.name,
                studentId: studentInfo.studentId,
                department: studentInfo.department,
                phone: studentInfo.phone,
                address: studentInfo.address,
                subcity: studentInfo.subcity,
                woreda: studentInfo.woreda,
              }
            : null,
          existingRequests: data.exitRequests,
        })

        // Optimistically show the request, then persist it. If the server rejects
        // it, roll back so the student is never told a request reached the proctor
        // when it did not.
        setData((prev) => ({ ...prev, exitRequests: [request, ...prev.exitRequests] }))
        const result = await requestService.persistExitRequest(request)
        if (!result || result.ok === false) {
          setData((prev) => ({
            ...prev,
            exitRequests: prev.exitRequests.filter((r) => r.id !== request.id),
          }))
          const message = result?.error || 'Could not submit the request. Please try again.'
          notify(message, 'danger')
          throw new Error(message)
        }
        notify(`Request ${request.code} submitted for proctor approval.`)
        return request
      },

      async cancelRequest(requestId) {
        const target = data.exitRequests.find((r) => r.id === requestId)
        if (!target || target.status !== 'pending') return
        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId && r.status === 'pending' ? { ...r, status: 'cancelled' } : r,
          ),
        }))
        const result = await requestService.cancelRequest(requestId)
        if (!result || result.ok === false) {
          setData((prev) => ({
            ...prev,
            exitRequests: prev.exitRequests.map((r) =>
              r.id === requestId && r.status === 'cancelled' ? { ...r, status: 'pending' } : r,
            ),
          }))
          notify(result?.error || 'Could not cancel the request. Please try again.', 'danger')
          return
        }
        notify('Request cancelled.', 'info')
      },

      async deleteRequest(requestId) {
        if (!requestId) return
        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.filter((r) => r.id !== requestId),
        }))
        const result = await requestService.deleteRequest(requestId)
        if (!result || result.ok === false) {
          syncFromBackend()
          notify(result?.error || 'Could not delete request.', 'danger')
          return
        }
        notify('Belongings record deleted.', 'info')
      },

      // Proctor: approve or reject a departure request.
      async reviewRequest(requestId, decision, note) {
        const targetRequest = data.exitRequests.find((r) => r.id === requestId)
        if (!targetRequest || targetRequest.status !== 'pending') return

        const targetStudentId = targetRequest?.studentId
        const previousStatus = targetRequest.status
        const previousUser = targetStudentId ? data.users.find((u) => u.id === targetStudentId) : null
        const previousApproval = previousUser?.approvalStatus

        setData((prev) => ({
          ...prev,
          exitRequests: prev.exitRequests.map((r) =>
            r.id === requestId || (targetRequest?.code && r.code === targetRequest.code)
              ? { ...r, status: decision, reviewedBy: currentUser?.id, reviewedAt: now(), reviewNote: note.trim() }
              : r,
          ),
          users: prev.users.map((u) =>
            u.id === targetStudentId ||
            (u.studentId && targetStudentId && u.studentId.toLowerCase() === targetStudentId.toLowerCase())
              ? { ...u, approvalStatus: decision === 'approved' ? 'approved' : 'rejected' }
              : u,
          ),
        }))
        if (
          currentUser?.id === targetStudentId ||
          (currentUser?.studentId && targetStudentId && currentUser.studentId.toLowerCase() === targetStudentId.toLowerCase())
        ) {
          setCurrentUser((prev) => ({ ...prev, approvalStatus: decision === 'approved' ? 'approved' : 'rejected' }))
        }

        const result = await requestService.reviewRequest(requestId, decision, note, currentUser?.id)
        if (!result || result.ok === false) {
          setData((prev) => ({
            ...prev,
            exitRequests: prev.exitRequests.map((r) =>
              r.id === requestId || (targetRequest?.code && r.code === targetRequest.code)
                ? { ...r, status: previousStatus, reviewedBy: targetRequest.reviewedBy, reviewedAt: targetRequest.reviewedAt, reviewNote: targetRequest.reviewNote }
                : r,
            ),
            users: prev.users.map((u) =>
              u.id === targetStudentId ||
              (u.studentId && targetStudentId && u.studentId.toLowerCase() === targetStudentId.toLowerCase())
                ? { ...u, approvalStatus: previousApproval }
                : u,
            ),
          }))
          if (
            currentUser?.id === targetStudentId ||
            (currentUser?.studentId && targetStudentId && currentUser.studentId.toLowerCase() === targetStudentId.toLowerCase())
          ) {
            setCurrentUser((prev) => ({ ...prev, approvalStatus: previousApproval }))
          }
          notify(result?.error || 'Could not review the request. Please try again.', 'danger')
          return
        }
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

      // Proctor/Student: create or update an account.
      async saveUser(user, { silent = false } = {}) {
        const validation = userService.validateAndPrepareUser(user, data.users)
        if (!validation.ok) return validation

        const id = user.id || uid('u')
        const cleaned = { ...validation.cleaned, id }

        // If this is a replay of an already processed submission in the local store
        if (validation.isReplayed) {
          return { ok: true, user: cleaned, isReplayed: true }
        }

        const nowIso = now()
        const userWithMeta = {
          ...cleaned,
          status: cleaned.status || 'active',
          createdAt: cleaned.createdAt || nowIso,
        }

        setData((prev) => {
          const exists = prev.users.some(
            (u) =>
              u.id === id ||
              (cleaned.idempotencyKey && u.idempotencyKey && u.idempotencyKey === cleaned.idempotencyKey) ||
              (cleaned.username && u.username && u.username.toLowerCase() === cleaned.username.toLowerCase()) ||
              (cleaned.studentId && u.studentId && u.studentId.trim().toLowerCase() === cleaned.studentId.trim().toLowerCase()),
          )
          return {
            ...prev,
            users: exists
              ? prev.users.map((u) =>
                  u.id === id ||
                  (cleaned.username && u.username && u.username.toLowerCase() === cleaned.username.toLowerCase()) ||
                  (cleaned.studentId && u.studentId && u.studentId.trim().toLowerCase() === cleaned.studentId.trim().toLowerCase())
                    ? { ...u, ...userWithMeta }
                    : u,
                )
              : [...prev.users, userWithMeta],
          }
        })

        if (
          currentUser?.id === id ||
          (currentUser?.username && cleaned.username && currentUser.username.toLowerCase() === cleaned.username.toLowerCase())
        ) {
          setCurrentUser((prev) => ({ ...prev, ...userWithMeta }))
        }

        if (!silent) notify(user.id ? 'Account updated.' : 'Account created.')

        try {
          const res = await api.saveUser(cleaned)
          if (res?.data?.user) {
            const backendUser = res.data.user
            setData((prev) => ({
              ...prev,
              users: prev.users.map((u) =>
                u.id === id || u.id === backendUser.id
                  ? { ...u, ...backendUser, password: u.password || cleaned.password }
                  : u,
              ),
            }))
            return { ok: true, user: backendUser }
          }
        } catch {
          // Keep optimistic/local update if backend unreachable
        }

        return { ok: true, user: userWithMeta }
      },

      toggleUserStatus(userId) {
        const user = data.users.find((u) => u.id === userId)
        if (!user) return
        const nextStatus = user.status === 'active' ? 'inactive' : 'active'
        userService.toggleStatus(userId)
        setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)) }))
        notify(`${user.name} ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`, 'info')
      },

      deleteUser(target) {
        const id = typeof target === 'object' && target !== null ? target.id : target
        const studentId = typeof target === 'object' && target !== null ? target.studentId : null

        if (id) userService.deleteUser(id)

        setData((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== id && (!studentId || u.studentId !== studentId)),
          exitRequests: prev.exitRequests.filter(
            (r) => r.studentId !== id && (!studentId || r.studentId?.toLowerCase() !== studentId?.toLowerCase()),
          ),
          belongings: prev.belongings.filter(
            (b) => b.studentId !== id && (!studentId || b.studentId?.toLowerCase() !== studentId?.toLowerCase()),
          ),
          gateLogs: prev.gateLogs.filter(
            (g) => g.studentId !== id && (!studentId || g.studentId?.toLowerCase() !== studentId?.toLowerCase()),
          ),
        }))

        notify('Record deleted.', 'info')
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

/**
 * User Domain Model
 * Describes what user data looks like across the frontend application.
 */
import { z } from 'zod'

export const ROLES = ['student', 'guard', 'proctor']

export const ROLE_LABELS = {
  student: 'Student',
  guard: 'Guard',
  proctor: 'Proctor',
}

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

export const DEPARTMENTS = [
  'Accounting',
  'Biology',
  'Civil Engineering',
  'Computer Science',
  'English Language',
  'Information Systems',
  'Mathematics Education',
  'Physics',
]

// --- Zod Client Schemas ---

export const userSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().trim().min(1, 'Full name is required.'),
  username: z.string().trim().min(1, 'Username is required.'),
  role: z.enum(['student', 'guard', 'proctor'], {
    errorMap: () => ({ message: 'Role must be student, guard, or proctor.' }),
  }),
  password: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  department: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  subcity: z.string().optional().nullable(),
  woreda: z.string().optional().nullable(),
  year: z.union([z.number(), z.string()]).optional().nullable(),
  dorm: z.string().optional().nullable(),
  gate: z.string().optional().nullable(),
  assignedBlocks: z.string().optional().nullable(),
  approvalStatus: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  registeredAt: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
})

/**
 * Initial empty template representing a new user form state.
 */
export const initialUserModel = {
  id: '',
  username: '',
  name: '',
  role: 'student',
  status: USER_STATUSES.ACTIVE,
  department: '',
  studentId: '',
  phone: '',
  address: 'Kotebe, Addis Ababa',
  subcity: 'Yeka',
  woreda: '08',
  approvalStatus: 'pending',
  gate: 'Main Gate',
  createdAt: '',
}

/**
 * Normalizes and shapes raw user data to strictly conform to UserModel.
 */
export function createUserModel(data = {}) {
  return {
    id: String(data.id || ''),
    username: String(data.username || '').trim(),
    name: String(data.name || '').trim(),
    role: ROLES.includes(data.role) ? data.role : 'student',
    status: data.status === USER_STATUSES.INACTIVE ? USER_STATUSES.INACTIVE : USER_STATUSES.ACTIVE,
    department: String(data.department || '').trim(),
    studentId: String(data.studentId || '').trim(),
    phone: String(data.phone || '').trim(),
    address: String(data.address || 'Kotebe, Addis Ababa').trim(),
    subcity: String(data.subcity || 'Yeka').trim(),
    woreda: String(data.woreda || '08').trim(),
    approvalStatus: data.approvalStatus || 'pending',
    gate: data.gate || 'Main Gate',
    createdAt: data.createdAt || new Date().toISOString(),
  }
}

/**
 * Validates a user model against required fields using Zod.
 * @param {Record<string, any>} user
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateUserModel(user) {
  const result = userSchema.safeParse(user)
  if (result.success) {
    return { valid: true, errors: {} }
  }

  const errors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] || 'general'
    if (!errors[field]) {
      errors[field] = issue.message
    }
  }
  return { valid: false, errors }
}

/**
 * Resolves complete student details for an exit request,
 * guaranteeing student name, actual student ID, department, phone number, address, subcity, and woreda.
 */
export function resolveStudent(request, users = []) {
  if (!request) return null
  const reqStudent = request.student || {}
  const targetId = request.studentId || reqStudent.studentId || reqStudent.id

  const user =
    users.find(
      (u) =>
        (targetId && u.id === targetId) ||
        (u.studentId && targetId && u.studentId.trim().toLowerCase() === String(targetId).trim().toLowerCase()) ||
        (u.studentId && reqStudent.studentId && u.studentId.trim().toLowerCase() === String(reqStudent.studentId).trim().toLowerCase()) ||
        (u.name && reqStudent.name && u.name.trim().toLowerCase() === String(reqStudent.name).trim().toLowerCase()),
    ) || {}

  const rawStudentCode =
    reqStudent.studentId ||
    user.studentId ||
    (!String(targetId).startsWith('u-') && !String(targetId).startsWith('r-') ? targetId : null)

  const name =
    (reqStudent.name && reqStudent.name !== 'Unknown' && reqStudent.name.trim()) ||
    (user.name && user.name !== 'Unknown' && user.name.trim()) ||
    'Student'

  const studentId = rawStudentCode || '—'
  const department = reqStudent.department || user.department || '—'
  const phone = reqStudent.phone || user.phone || '—'
  const address = reqStudent.address || user.address || '—'
  const subcity = reqStudent.subcity || user.subcity || '—'
  const woreda = reqStudent.woreda || user.woreda || '—'

  return {
    ...user,
    ...reqStudent,
    name,
    studentId,
    department,
    phone,
    address,
    subcity,
    woreda,
  }
}


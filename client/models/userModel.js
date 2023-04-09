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
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Full name is required.'),
  username: z.string().trim().min(1, 'Username is required.'),
  role: z.enum(['student', 'guard', 'proctor'], {
    errorMap: () => ({ message: 'Role must be student, guard, or proctor.' }),
  }),
  status: z.enum(['active', 'inactive']).default('active'),
  department: z.string().optional(),
  studentId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  subcity: z.string().optional(),
  woreda: z.string().optional(),
  approvalStatus: z.string().optional(),
  gate: z.string().optional(),
  createdAt: z.string().optional(),
  idempotencyKey: z.string().optional(),
}).refine(
  (data) => data.role !== 'student' || (data.studentId && data.studentId.trim().length > 0),
  {
    message: 'Student ID is required for student accounts.',
    path: ['studentId'],
  },
)

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
  approvalStatus: 'approve',
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
    approvalStatus: data.approvalStatus || 'approve',
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

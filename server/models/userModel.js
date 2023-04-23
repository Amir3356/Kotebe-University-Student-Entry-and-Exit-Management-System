// Model: The representation of your data (users table)
import { z } from 'zod'

export const ROLES = ['student', 'guard', 'proctor']
export const STATUSES = ['active', 'inactive']
export const APPROVAL_STATUSES = ['approve', 'pending', 'reject']

// --- Zod Validation Schemas ---

export const loginSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).trim().min(1, 'Username cannot be empty'),
  role: z.enum(['student', 'guard', 'proctor']).optional().nullable(),
  password: z.string().optional(),
})

export const userCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string({ required_error: 'Full name is required' }).trim().min(1, 'Name cannot be empty'),
  username: z.string({ required_error: 'Username is required' }).trim().min(1, 'Username cannot be empty'),
  role: z.enum(['student', 'guard', 'proctor'], {
    errorMap: () => ({ message: 'Role must be student, guard, or proctor' }),
  }),
  password: z.string().optional().default('password123'),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  subcity: z.string().optional().nullable(),
  woreda: z.string().optional().nullable(),
  year: z.coerce.number().int().min(1).max(7).optional().default(1),
  dorm: z.string().optional().nullable(),
  gate: z.string().optional().nullable(),
  assignedBlocks: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  approvalStatus: z.enum(['approve', 'pending', 'reject']).default('pending'),
  idempotencyKey: z.string().optional().nullable(),
})

export const userUpdateSchema = userCreateSchema.partial()

export const User = {
  tableName: 'users',
  roles: ROLES,
  statuses: STATUSES,
  approvalStatuses: APPROVAL_STATUSES,
  schemas: {
    login: loginSchema,
    create: userCreateSchema,
    update: userUpdateSchema,
  },

  /**
   * Transforms raw database record into formatted domain model
   */
  fromRow(row) {
    if (!row) return null
    return {
      id: row.id,
      role: row.role,
      name: row.name,
      username: row.username,
      email: row.email,
      phone: row.phone,
      studentId: row.student_id,
      department: row.department,
      address: row.address,
      subcity: row.subcity,
      woreda: row.woreda,
      year: row.year,
      dorm: row.dorm,
      gate: row.gate,
      assignedBlocks: row.assigned_blocks,
      status: row.status,
      approvalStatus: row.approval_status,
      createdAt: row.created_at,
    }
  },
}

// Backwards-compatible exports
export const formatUser = User.fromRow

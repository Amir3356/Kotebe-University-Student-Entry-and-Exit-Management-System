/**
 * Exit Request Domain Model
 * Describes what student exit permission requests look like across the frontend application.
 */
import { z } from 'zod'
import { snapshotItem } from './belongingModel'

export const REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const GATES = ['Main Gate', 'Back Gate']

// --- Zod Client Schemas ---

export const requestItemSchema = z.object({
  id: z.string().optional(),
  belongingId: z.string().optional().nullable(),
  category: z.string().optional().default('Other'),
  description: z.string().trim().min(1, 'Item description is required.'),
  serialNumber: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
})

export const exitRequestSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  studentId: z.string().optional(),
  reason: z.string().trim().min(1, 'Reason for exit is required.'),
  destination: z.string().trim().min(1, 'Destination is required.'),
  departureDate: z.string().min(1, 'Departure date is required.'),
  returnDate: z.string().min(1, 'Expected return date is required.'),
  items: z.array(requestItemSchema).min(1, 'At least one item must be selected for exit permission.'),
  status: z.string().optional(),
}).refine(
  (data) => !data.departureDate || !data.returnDate || data.returnDate >= data.departureDate,
  {
    message: 'Return date cannot be before departure date.',
    path: ['returnDate'],
  },
)

/**
 * Initial empty template representing a new exit request form state.
 */
export const initialRequestModel = {
  id: '',
  code: '',
  studentId: '',
  reason: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  items: [],
  status: REQUEST_STATUSES.PENDING,
  createdAt: '',
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: '',
  verifiedBy: null,
  exitedAt: null,
}

/**
 * Computes the next sequential request code in format EXR-YYYY-XXXX.
 */
export function nextRequestCode(requests = []) {
  const year = new Date().getFullYear()
  const max = requests.reduce((acc, r) => {
    if (!r?.code) return acc
    const num = Number(r.code.split('-').pop()) || 0
    return Math.max(acc, num)
  }, 0)
  return `EXR-${year}-${String(max + 1).padStart(4, '0')}`
}

/**
 * Normalizes and shapes raw request data to strictly conform to ExitRequestModel.
 */
export function createRequestModel(data = {}) {
  return {
    id: String(data.id || ''),
    code: String(data.code || ''),
    studentId: String(data.studentId || ''),
    reason: String(data.reason || '').trim(),
    destination: String(data.destination || '').trim(),
    departureDate: String(data.departureDate || ''),
    returnDate: String(data.returnDate || ''),
    items: Array.isArray(data.items)
      ? data.items.map((i) => ({
          id: i.id || '',
          belongingId: i.belongingId ?? null,
          ...snapshotItem(i),
        }))
      : [],
    status: Object.values(REQUEST_STATUSES).includes(data.status)
      ? data.status
      : REQUEST_STATUSES.PENDING,
    createdAt: data.createdAt || new Date().toISOString(),
    reviewedBy: data.reviewedBy || null,
    reviewedAt: data.reviewedAt || null,
    reviewNote: String(data.reviewNote || '').trim(),
    verifiedBy: data.verifiedBy || null,
    exitedAt: data.exitedAt || null,
  }
}

/**
 * Validates an exit request model using Zod.
 */
export function validateRequestModel(req) {
  const result = exitRequestSchema.safeParse(req)
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

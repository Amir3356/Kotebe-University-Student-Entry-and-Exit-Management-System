/**
 * Belonging Domain Model
 * Describes what student belonging items look like across the frontend application.
 */
import { z } from 'zod'

export const ITEM_CATEGORIES = [
  'Laptop',
  'Desktop Computer',
  'Tablet',
  'Electronics',
  'Other',
]

export const BELONGING_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

// --- Zod Client Schemas ---

export const belongingSchema = z.object({
  id: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().trim().min(1, 'Description is required.'),
  brand: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  registeredBy: z.string().optional().nullable(),
  registeredAt: z.string().optional().nullable(),
})

/**
 * Initial empty template representing a new belonging form state.
 */
export const initialBelongingModel = {
  id: '',
  studentId: '',
  category: 'Laptop',
  description: '',
  brand: '',
  serialNumber: '',
  color: '',
  status: BELONGING_STATUSES.ACTIVE,
  registeredBy: '',
  registeredAt: '',
}

/**
 * Creates an immutable snapshot representation of an item for gate logs and exit requests.
 */
export function snapshotItem(item = {}) {
  return {
    category: item.category || 'Other',
    description: (item.description || '').trim(),
    serialNumber: (item.serialNumber || '').trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
  }
}

/**
 * Normalizes and shapes raw belonging data to strictly conform to BelongingModel.
 */
export function createBelongingModel(data = {}) {
  return {
    id: String(data.id || ''),
    studentId: String(data.studentId || ''),
    category: ITEM_CATEGORIES.includes(data.category) ? data.category : 'Other',
    description: String(data.description || '').trim(),
    brand: String(data.brand || '').trim(),
    serialNumber: String(data.serialNumber || '').trim(),
    color: String(data.color || '').trim(),
    status: data.status === 'off_campus' || data.status === BELONGING_STATUSES.INACTIVE
      ? BELONGING_STATUSES.INACTIVE
      : BELONGING_STATUSES.ACTIVE,
    registeredBy: String(data.registeredBy || ''),
    registeredAt: data.registeredAt || new Date().toISOString(),
  }
}

/**
 * Validates a belonging model against mandatory fields using Zod.
 */
export function validateBelongingModel(item) {
  const result = belongingSchema.safeParse(item)
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

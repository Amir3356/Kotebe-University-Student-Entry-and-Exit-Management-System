// Model: The representation of your data (belongings table)
import { z } from 'zod'

export const ITEM_CATEGORIES = [
  'Laptop',
  'Desktop Computer',
  'Tablet',
  'Electronics',
  'Mobile Phone',
  'Clothing',
  'Other',
]

export const BELONGING_STATUSES = ['active', 'inactive']

// --- Zod Validation Schemas ---

export const belongingCreateSchema = z.object({
  id: z.string().optional(),
  studentId: z.string({ required_error: 'Student ID is required' }).trim().min(1, 'Student ID cannot be empty'),
  category: z.string().default('Other'),
  description: z.string({ required_error: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
  brand: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  registeredBy: z.string().optional().nullable(),
})

export const belongingUpdateSchema = belongingCreateSchema.partial()

export const Belonging = {
  tableName: 'belongings',
  categories: ITEM_CATEGORIES,
  statuses: BELONGING_STATUSES,
  schemas: {
    create: belongingCreateSchema,
    update: belongingUpdateSchema,
  },

  /**
   * Transforms raw database record into formatted domain model
   */
  fromRow(row) {
    if (!row) return null
    return {
      id: row.id,
      studentId: row.student_id,
      category: row.category,
      description: row.description,
      brand: row.brand || '',
      serialNumber: row.serial_number || '',
      color: row.color || '',
      status: row.status,
      registeredBy: row.registered_by,
      registeredAt: row.registered_at,
    }
  },
}

// Backwards-compatible exports
export const formatBelonging = Belonging.fromRow

// Model: The representation of your data (exit_requests & exit_request_items tables)
import { z } from 'zod'

export const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled']

// --- Zod Validation Schemas ---

export const requestItemSchema = z.object({
  id: z.string().optional(),
  belongingId: z.string().optional().nullable(),
  category: z.string().optional().default('Other'),
  description: z.string({ required_error: 'Item description is required' }).trim().min(1, 'Item description cannot be empty'),
  serialNumber: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
})

export const exitRequestCreateSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  studentId: z.string({ required_error: 'Student ID is required' }).trim().min(1, 'Student ID cannot be empty'),
  reason: z.string({ required_error: 'Reason is required' }).trim().min(1, 'Reason cannot be empty'),
  destination: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : 'Home'),
    z.string().min(1, 'Destination cannot be empty'),
  ),
  departureDate: z.string({ required_error: 'Departure date is required' }).min(1, 'Departure date cannot be empty'),
  returnDate: z.string().optional().nullable(),
  items: z.array(requestItemSchema).min(1, 'At least one item must be included in the exit request'),
  student: z.object({
    name: z.string().optional().nullable(),
    studentId: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    subcity: z.string().optional().nullable(),
    woreda: z.string().optional().nullable(),
  }).optional().nullable(),
})

export const reviewRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Decision must be either "approved" or "rejected"' }),
  }),
  note: z.string().optional().default(''),
  reviewedBy: z.string().optional().nullable(),
})

export const ExitRequest = {
  tableName: 'exit_requests',
  itemsTableName: 'exit_request_items',
  statuses: REQUEST_STATUSES,
  schemas: {
    create: exitRequestCreateSchema,
    review: reviewRequestSchema,
    item: requestItemSchema,
  },

  fromRow(row, items = []) {
    if (!row) return null
    return {
      id: row.id,
      code: row.code,
      studentId: row.student_id,
      reason: row.reason,
      destination: row.destination,
      departureDate: row.departure_date,
      returnDate: row.return_date,
      status: row.status,
      createdAt: row.created_at,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note,
      verifiedBy: row.verified_by,
      exitedAt: row.exited_at,
      items,
      student: row.student || {
        name: row.student_name || null,
        studentId: row.student_code || row.student_id || null,
        department: row.department || null,
        phone: row.phone || null,
        address: row.address || null,
        subcity: row.subcity || null,
        woreda: row.woreda || null,
      },
    }
  },

  fromItemRow(row) {
    if (!row) return null
    return {
      id: row.id,
      belongingId: row.belonging_id || row.belongingId || null,
      category: row.category || 'Item',
      description: row.description,
      serialNumber: row.serial_number || row.serialNumber || '',
      quantity: row.quantity || 1,
    }
  },
}

// Backwards-compatible exports
export const formatExitRequest = ExitRequest.fromRow
export const formatRequestItem = ExitRequest.fromItemRow

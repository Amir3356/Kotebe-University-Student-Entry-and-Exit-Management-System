// Model: The representation of your data (gate_logs table)
import { z } from 'zod'

export const GATE_LOG_TYPES = ['entry', 'exit', 'denied']

// --- Zod Validation Schemas ---

export const recordEntrySchema = z.object({
  studentId: z.string({ required_error: 'Student ID is required' }).trim().min(1, 'Student ID cannot be empty'),
  guardId: z.string().optional().nullable(),
  gate: z.string().default('Main Gate'),
  returningIds: z.array(z.string()).default([]),
  newItems: z.array(z.any()).default([]),
  note: z.string().optional().default(''),
})

export const allowExitSchema = z.object({
  requestId: z.string({ required_error: 'Request ID is required' }).trim().min(1, 'Request ID cannot be empty'),
  guardId: z.string().optional().nullable(),
  gate: z.string().default('Main Gate'),
  note: z.string().optional().default(''),
})

export const denyExitSchema = z.object({
  requestId: z.string({ required_error: 'Request ID is required' }).trim().min(1, 'Request ID cannot be empty'),
  guardId: z.string().optional().nullable(),
  gate: z.string().default('Main Gate'),
  reason: z.string({ required_error: 'Reason for denial is required' }).trim().min(1, 'Reason cannot be empty'),
})

export const GateLog = {
  tableName: 'gate_logs',
  types: GATE_LOG_TYPES,
  schemas: {
    recordEntry: recordEntrySchema,
    allowExit: allowExitSchema,
    denyExit: denyExitSchema,
  },

  fromRow(row) {
    if (!row) return null
    let items = []
    try {
      items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
    } catch {
      items = []
    }
    return {
      id: row.id,
      type: row.type,
      studentId: row.student_id,
      guardId: row.guard_id,
      gate: row.gate,
      timestamp: row.timestamp,
      requestId: row.request_id,
      note: row.note || '',
      items,
    }
  },
}

// Backwards-compatible exports
export const formatGateLog = GateLog.fromRow

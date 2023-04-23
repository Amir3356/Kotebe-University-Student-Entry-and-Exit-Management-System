/**
 * Gate Log Domain Model
 * Describes what security gate transaction logs look like across the frontend application.
 */
import { z } from 'zod'
import { snapshotItem } from './belongingModel'

export const GATE_LOG_TYPES = {
  ENTRY: 'entry',
  EXIT: 'exit',
  DENIED: 'denied',
}

// --- Zod Client Schemas ---

export const gateLogSchema = z.object({
  id: z.string().optional().nullable(),
  type: z.enum(['entry', 'exit', 'denied'], {
    errorMap: () => ({ message: 'Log transaction type is required.' }),
  }),
  studentId: z.string().trim().min(1, 'Student ID is required.'),
  guardId: z.string().optional().nullable(),
  gate: z.string().default('Main Gate'),
  timestamp: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  items: z.array(z.any()).default([]),
}).refine(
  (data) => data.type !== 'denied' || (data.note && data.note.trim().length > 0),
  {
    message: 'Reason for denial is required.',
    path: ['note'],
  },
)

/**
 * Initial empty template representing a gate log.
 */
export const initialGateLogModel = {
  id: '',
  type: GATE_LOG_TYPES.ENTRY,
  studentId: '',
  guardId: '',
  gate: 'Main Gate',
  timestamp: '',
  requestId: null,
  note: '',
  items: [],
}

/**
 * Normalizes and shapes raw log data to strictly conform to GateLogModel.
 */
export function createGateLogModel(data = {}) {
  return {
    id: String(data.id || ''),
    type: Object.values(GATE_LOG_TYPES).includes(data.type)
      ? data.type
      : GATE_LOG_TYPES.ENTRY,
    studentId: String(data.studentId || ''),
    guardId: String(data.guardId || ''),
    gate: String(data.gate || 'Main Gate'),
    timestamp: data.timestamp || new Date().toISOString(),
    requestId: data.requestId || null,
    note: String(data.note || '').trim(),
    items: Array.isArray(data.items) ? data.items.map(snapshotItem) : [],
  }
}

/**
 * Validates a gate log model using Zod.
 */
export function validateGateLogModel(log) {
  const result = gateLogSchema.safeParse(log)
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

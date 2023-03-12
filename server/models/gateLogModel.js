// Model: The representation of your data (gate_logs table)

export const GateLog = {
  tableName: 'gate_logs',

  types: ['entry', 'exit', 'denied'],

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
export const GATE_LOG_TYPES = GateLog.types

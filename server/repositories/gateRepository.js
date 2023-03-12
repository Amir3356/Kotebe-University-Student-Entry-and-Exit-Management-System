import { query, pool } from '../config/db.js'

export const gateRepository = {
  async findAll({ type, period, studentId, search } = {}) {
    let sql = `SELECT * FROM gate_logs WHERE 1=1`
    const params = []

    if (type && type !== 'all') {
      params.push(type)
      sql += ` AND type = $${params.length}`
    }

    if (studentId) {
      params.push(studentId)
      sql += ` AND student_id = $${params.length}`
    }

    if (period === 'today') {
      sql += ` AND timestamp >= CURRENT_DATE`
    } else if (period === 'week') {
      sql += ` AND timestamp >= NOW() - INTERVAL '7 days'`
    } else if (period === 'month') {
      sql += ` AND timestamp >= NOW() - INTERVAL '30 days'`
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`)
      sql += ` AND (LOWER(gate) LIKE $${params.length} OR LOWER(note) LIKE $${params.length})`
    }

    sql += ` ORDER BY timestamp DESC`
    const result = await query(sql, params)
    return result.rows
  },

  async create(logData, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(
      `INSERT INTO gate_logs (
        id, type, student_id, guard_id, gate, timestamp, request_id, note, items
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)
      RETURNING *`,
      [
        logData.id,
        logData.type,
        logData.studentId,
        logData.guardId || null,
        logData.gate || 'Main Gate',
        logData.requestId || null,
        logData.note || '',
        JSON.stringify(logData.items || []),
      ],
    )
    return result.rows[0]
  },
}

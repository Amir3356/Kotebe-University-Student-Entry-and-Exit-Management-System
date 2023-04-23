import { query, pool } from '../config/db.js'

export const requestRepository = {
  async findAll({ studentId, status, search } = {}) {
    let sql = `
      SELECT r.*,
             u.name as student_name,
             u.student_id as student_code,
             u.department,
             u.phone,
             u.address,
             u.subcity,
             u.woreda
      FROM exit_requests r
      LEFT JOIN users u ON r.student_id = u.id
      WHERE 1=1
    `
    const params = []

    if (studentId) {
      params.push(studentId)
      sql += ` AND (r.student_id = $${params.length} OR LOWER(u.student_id) = LOWER($${params.length}))`
    }

    if (status && status !== 'all') {
      params.push(status)
      sql += ` AND r.status = $${params.length}`
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`)
      sql += ` AND (
        LOWER(r.code) LIKE $${params.length} OR
        LOWER(r.destination) LIKE $${params.length} OR
        LOWER(r.reason) LIKE $${params.length} OR
        LOWER(COALESCE(u.name, '')) LIKE $${params.length} OR
        LOWER(COALESCE(u.student_id, '')) LIKE $${params.length} OR
        LOWER(COALESCE(u.department, '')) LIKE $${params.length} OR
        LOWER(COALESCE(u.phone, '')) LIKE $${params.length}
      )`
    }

    sql += ` ORDER BY r.created_at DESC`
    const result = await query(sql, params)
    return result.rows
  },

  async findById(id) {
    const result = await query(
      `SELECT r.*,
              u.name as student_name,
              u.student_id as student_code,
              u.department,
              u.phone,
              u.address,
              u.subcity,
              u.woreda
       FROM exit_requests r
       LEFT JOIN users u ON r.student_id = u.id
       WHERE r.id = $1`,
      [id],
    )
    return result.rows[0] || null
  },

  async findItemsByRequestId(requestId) {
    const result = await query(
      `SELECT id, belonging_id, category, description, serial_number, quantity
       FROM exit_request_items WHERE request_id = $1 ORDER BY id ASC`,
      [requestId],
    )
    return result.rows
  },

  async findItemsByRequestIds(requestIds) {
    if (!requestIds || requestIds.length === 0) return []
    const result = await query(
      `SELECT id, request_id, belonging_id, category, description, serial_number, quantity
       FROM exit_request_items WHERE request_id = ANY($1) ORDER BY id ASC`,
      [requestIds],
    )
    return result.rows
  },

  async countByCodePrefix(prefix, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(
      `SELECT COUNT(*) as count FROM exit_requests WHERE code LIKE $1`,
      [`${prefix}%`],
    )
    return parseInt(result.rows[0].count, 10)
  },

  async create(reqData, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(
      `INSERT INTO exit_requests (
        id, code, student_id, reason, destination, departure_date, return_date,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING *`,
      [
        reqData.id,
        reqData.code,
        reqData.studentId,
        reqData.reason,
        reqData.destination,
        reqData.departureDate,
        reqData.returnDate || null,
      ],
    )
    return result.rows[0]
  },

  async createItem(item, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(
      `INSERT INTO exit_request_items (
        id, request_id, belonging_id, category, description, serial_number, quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        item.id,
        item.requestId,
        item.belongingId || null,
        item.category || null,
        item.description,
        item.serialNumber || null,
        item.quantity || 1,
      ],
    )
    return result.rows[0]
  },

  async review(id, decision, reviewedBy, note) {
    const result = await query(
      `UPDATE exit_requests SET
        status = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        review_note = $3
      WHERE id = $4 AND status = 'pending'
      RETURNING *`,
      [decision, reviewedBy || null, note || '', id],
    )
    return result.rows[0] || null
  },

  async cancel(id) {
    const result = await query(
      `UPDATE exit_requests SET status = 'cancelled'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id],
    )
    return result.rows[0] || null
  },

  async complete(id, verifiedBy, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(
      `UPDATE exit_requests SET
        status = 'completed',
        verified_by = $1,
        exited_at = NOW()
      WHERE id = $2
      RETURNING *`,
      [verifiedBy || null, id],
    )
    return result.rows[0] || null
  },
}

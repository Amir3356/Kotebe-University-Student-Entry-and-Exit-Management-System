import { query, pool } from '../config/db.js'

export const belongingRepository = {
  async findAll({ studentId, status, category, search } = {}) {
    let sql = `SELECT * FROM belongings WHERE 1=1`
    const params = []

    if (studentId) {
      params.push(studentId)
      sql += ` AND student_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      sql += ` AND status = $${params.length}`
    }

    if (category && category !== 'all') {
      params.push(category)
      sql += ` AND category = $${params.length}`
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`)
      sql += ` AND (LOWER(description) LIKE $${params.length} OR LOWER(serial_number) LIKE $${params.length} OR LOWER(brand) LIKE $${params.length})`
    }

    sql += ` ORDER BY registered_at DESC`
    const result = await query(sql, params)
    return result.rows
  },

  async findById(id) {
    const result = await query(`SELECT * FROM belongings WHERE id = $1`, [id])
    return result.rows[0] || null
  },

  async findByIds(ids, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(`SELECT * FROM belongings WHERE id = ANY($1)`, [ids])
    return result.rows
  },

  async create(item, dbClient = null) {
    const executor = dbClient || pool
    const result = await executor.query(
      `INSERT INTO belongings (
        id, student_id, category, description, brand, serial_number, color,
        status, registered_by, registered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        item.id,
        item.studentId,
        item.category || 'Other',
        item.description,
        item.brand || null,
        item.serialNumber || null,
        item.color || null,
        item.status || 'active',
        item.registeredBy || null,
      ],
    )
    return result.rows[0]
  },

  async update(id, item) {
    const result = await query(
      `UPDATE belongings SET
        category = COALESCE($1, category),
        description = COALESCE($2, description),
        brand = COALESCE($3, brand),
        serial_number = COALESCE($4, serial_number),
        color = COALESCE($5, color),
        status = COALESCE($6, status)
      WHERE id = $7
      RETURNING *`,
      [item.category, item.description, item.brand, item.serialNumber, item.color, item.status, id],
    )
    return result.rows[0] || null
  },

  async updateStatus(id, nextStatus) {
    const result = await query(
      `UPDATE belongings SET status = $1 WHERE id = $2 RETURNING *`,
      [nextStatus, id],
    )
    return result.rows[0] || null
  },

  async updateStatusBulk(ids, status, dbClient = null) {
    const executor = dbClient || pool
    await executor.query(`UPDATE belongings SET status = $1 WHERE id = ANY($2)`, [status, ids])
  },

  async delete(id) {
    const result = await query(`DELETE FROM belongings WHERE id = $1 RETURNING id`, [id])
    return result.rowCount > 0
  },
}

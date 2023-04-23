import { query } from '../config/db.js'

export const userRepository = {
  async findAll({ role, status, search } = {}) {
    let sql = `SELECT * FROM users WHERE role != 'admin'`
    const params = []

    if (role) {
      params.push(role)
      sql += ` AND role = $${params.length}`
    }

    if (status) {
      params.push(status)
      sql += ` AND status = $${params.length}`
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`)
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(username) LIKE $${params.length} OR LOWER(student_id) LIKE $${params.length} OR LOWER(department) LIKE $${params.length})`
    }

    sql += ` ORDER BY created_at DESC`
    const result = await query(sql, params)
    return result.rows
  },

  async findById(id) {
    const result = await query(`SELECT * FROM users WHERE id = $1`, [id])
    return result.rows[0] || null
  },

  async findByUsernameOrStudentId(term, role = null) {
    if (!term || !String(term).trim()) return null
    const q = String(term).trim().toLowerCase()
    const params = [q]
    let sql = `SELECT * FROM users
       WHERE (LOWER(username) = $1 OR LOWER(student_id) = $1 OR LOWER(name) = $1)
         AND status = 'active'`

    if (role) {
      params.push(role)
      sql += ` AND role = $${params.length}`
    }

    sql += ` ORDER BY CASE WHEN LOWER(username) = $1 THEN 1 WHEN LOWER(student_id) = $1 THEN 2 ELSE 3 END ASC LIMIT 1`
    const result = await query(sql, params)
    return result.rows[0] || null
  },

  async findFirstActiveByRole(role) {
    const result = await query(
      `SELECT * FROM users WHERE role = $1 AND status = 'active' ORDER BY created_at ASC LIMIT 1`,
      [role],
    )
    return result.rows[0] || null
  },

  async isUsernameTaken(username, excludeId = null) {
    const result = await query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != COALESCE($2, '')`,
      [username.trim(), excludeId || ''],
    )
    return result.rows.length > 0
  },

  async isStudentIdTaken(studentId, excludeId = null) {
    const result = await query(
      `SELECT id FROM users WHERE LOWER(student_id) = LOWER($1) AND id != COALESCE($2, '')`,
      [studentId.trim(), excludeId || ''],
    )
    return result.rows.length > 0
  },

  async create(user) {
    const result = await query(
      `INSERT INTO users (
        id, role, name, username, password, email, phone, student_id,
        department, address, subcity, woreda, year, dorm, gate,
        assigned_blocks, status, approval_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *`,
      [
        user.id,
        user.role,
        user.name,
        user.username,
        user.password,
        user.email || null,
        user.phone || null,
        user.studentId || null,
        user.department || null,
        user.address || null,
        user.subcity || null,
        user.woreda || null,
        user.year || 1,
        user.dorm || null,
        user.gate || null,
        user.assignedBlocks || null,
        user.status || 'active',
        user.approvalStatus || 'pending',
      ],
    )
    return result.rows[0]
  },

  async update(id, user) {
    const result = await query(
      `UPDATE users SET
        name = $1,
        username = $2,
        password = COALESCE($3, password),
        email = $4,
        phone = $5,
        student_id = $6,
        department = $7,
        address = $8,
        subcity = $9,
        woreda = $10,
        year = $11,
        dorm = $12,
        gate = $13,
        assigned_blocks = $14,
        status = COALESCE($15, status),
        approval_status = COALESCE($16, approval_status),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *`,
      [
        user.name,
        user.username,
        user.password || null,
        user.email || null,
        user.phone || null,
        user.studentId || null,
        user.department || null,
        user.address || null,
        user.subcity || null,
        user.woreda || null,
        user.year || 1,
        user.dorm || null,
        user.gate || null,
        user.assignedBlocks || null,
        user.status || null,
        user.approvalStatus || null,
        id,
      ],
    )
    return result.rows[0] || null
  },

  async updateStatus(id, nextStatus) {
    const result = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [nextStatus, id],
    )
    return result.rows[0] || null
  },

  async delete(id) {
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id])
    return result.rowCount > 0
  },
}

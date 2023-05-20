import { requestRepository } from '../repositories/requestRepository.js'
import { formatExitRequest, formatRequestItem } from '../models/requestModel.js'
import { formatUser } from '../models/userModel.js'
import { wsEvents } from '../config/socket.js'
import { pool } from '../config/db.js'

export const requestService = {
  async getAllRequests(filters) {
    const requests = await requestRepository.findAll(filters)
    if (requests.length === 0) return []

    const requestIds = requests.map((r) => r.id)
    const items = await requestRepository.findItemsByRequestIds(requestIds)

    const itemsMap = {}
    for (const item of items) {
      if (!itemsMap[item.request_id]) itemsMap[item.request_id] = []
      itemsMap[item.request_id].push(formatRequestItem(item))
    }

    return requests.map((r) => formatExitRequest(r, itemsMap[r.id] || []))
  },

  async getRequestById(id) {
    const row = await requestRepository.findById(id)
    if (!row) throw new Error('Exit request not found.')

    const items = await requestRepository.findItemsByRequestId(id)
    return formatExitRequest(row, items.map(formatRequestItem))
  },

  async createRequest({ id, code: providedCode, studentId, reason, destination, departureDate, returnDate, items, student }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const year = new Date().getFullYear()
      const count = await requestRepository.countByCodePrefix(`EXR-${year}-`, client)
      const code = providedCode || `EXR-${year}-${String(count + 1).padStart(4, '0')}`
      const requestId = id || `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

      // Ensure student exists in users table to satisfy foreign key constraint
      const userCheck = await client.query(
        'SELECT id, name, username, student_id, department, phone, address, subcity, woreda FROM users WHERE id = $1 OR (student_id IS NOT NULL AND LOWER(student_id) = LOWER($1))',
        [studentId],
      )

      let actualUserId = studentId
      let studentRecord = null

      if (userCheck.rows.length === 0) {
        const cleanUser =
          (student?.username && student.username.trim()) ||
          `student_${studentId.replace(/[^a-zA-Z0-9]/g, '_')}`
        const ins = await client.query(
          `INSERT INTO users (
            id, role, name, username, password, status, approval_status,
            student_id, department, phone, address, subcity, woreda, created_at, updated_at
          ) VALUES ($1, 'student', $2, $3, 'password123', 'active', 'pending', $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, users.name),
            student_id = COALESCE(EXCLUDED.student_id, users.student_id),
            department = COALESCE(EXCLUDED.department, users.department),
            phone = COALESCE(EXCLUDED.phone, users.phone),
            address = COALESCE(EXCLUDED.address, users.address),
            subcity = COALESCE(EXCLUDED.subcity, users.subcity),
            woreda = COALESCE(EXCLUDED.woreda, users.woreda),
            updated_at = NOW()
          RETURNING *`,
          [
            studentId,
            student?.name?.trim() || 'Student',
            cleanUser,
            student?.studentId?.trim() || studentId,
            student?.department?.trim() || null,
            student?.phone?.trim() || null,
            student?.address?.trim() || null,
            student?.subcity?.trim() || null,
            student?.woreda?.trim() || null,
          ],
        )
        studentRecord = ins.rows[0]
        actualUserId = studentRecord ? studentRecord.id : studentId
      } else {
        actualUserId = userCheck.rows[0].id
        studentRecord = userCheck.rows[0]
        if (student) {
          const upd = await client.query(
            `UPDATE users SET
              name = COALESCE($1, name),
              student_id = COALESCE($2, student_id),
              department = COALESCE($3, department),
              phone = COALESCE($4, phone),
              address = COALESCE($5, address),
              subcity = COALESCE($6, subcity),
              woreda = COALESCE($7, woreda),
              updated_at = NOW()
            WHERE id = $8
            RETURNING *`,
            [
              student.name?.trim() || null,
              student.studentId?.trim() || null,
              student.department?.trim() || null,
              student.phone?.trim() || null,
              student.address?.trim() || null,
              student.subcity?.trim() || null,
              student.woreda?.trim() || null,
              actualUserId,
            ],
          )
          if (upd.rows[0]) studentRecord = upd.rows[0]
        }
      }

      const created = await requestRepository.create(
        {
          id: requestId,
          code,
          studentId: actualUserId,
          reason: reason.trim(),
          destination: (destination && destination.trim()) || 'Home',
          departureDate,
          returnDate: returnDate || null,
        },
        client,
      )

      const createdItems = []
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemId = `ri-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
          const insItem = await requestRepository.createItem(
            {
              id: itemId,
              requestId,
              belongingId: item.belongingId || null,
              category: item.category || 'Item',
              description: item.description ? item.description.trim() : 'Item',
              serialNumber: item.serialNumber ? item.serialNumber.trim() : null,
              quantity: Number(item.quantity) || 1,
            },
            client,
          )
          createdItems.push(formatRequestItem(insItem))
        }
      }

      await client.query('COMMIT')

      created.student = {
        name: studentRecord?.name || student?.name || null,
        studentId: studentRecord?.student_id || student?.studentId || null,
        department: studentRecord?.department || student?.department || null,
        phone: studentRecord?.phone || student?.phone || null,
        address: studentRecord?.address || student?.address || null,
        subcity: studentRecord?.subcity || student?.subcity || null,
        woreda: studentRecord?.woreda || student?.woreda || null,
      }

      if (studentRecord) {
        try {
          wsEvents.userUpdated(formatUser(studentRecord))
        } catch {}
      }

      return formatExitRequest(created, createdItems)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  async reviewRequest(id, decision, note, reviewedBy) {
    const updated = await requestRepository.review(id, decision, reviewedBy, note)
    if (!updated) {
      throw new Error('Request is not in pending status or not found.')
    }

    if (updated.student_id) {
      const userStatus = decision === 'approved' ? 'approve' : 'reject'
      await pool.query(
        `UPDATE users SET approval_status = $1, updated_at = NOW() WHERE id = $2 OR (student_id IS NOT NULL AND LOWER(student_id) = LOWER($2))`,
        [userStatus, updated.student_id],
      ).catch(() => {})
    }

    const fullRow = await requestRepository.findById(id)
    const items = await requestRepository.findItemsByRequestId(id)
    return formatExitRequest(fullRow || updated, items.map(formatRequestItem))
  },

  async cancelRequest(id) {
    const updated = await requestRepository.cancel(id)
    if (!updated) {
      throw new Error('Cannot cancel request (must be in pending status).')
    }

    const items = await requestRepository.findItemsByRequestId(id)
    return formatExitRequest(updated, items.map(formatRequestItem))
  },

  async deleteRequest(id) {
    const deleted = await requestRepository.delete(id)
    if (!deleted) {
      throw new Error('Request not found.')
    }
    return { ok: true, id }
  },

  async updateRequest(id, { reason, destination, departureDate, returnDate, items, student }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const updated = await requestRepository.update(
        id,
        { reason, destination, departureDate, returnDate },
        client,
      )
      if (!updated) {
        throw new Error('Request not found.')
      }

      if (Array.isArray(items)) {
        await client.query('DELETE FROM exit_request_items WHERE request_id = $1', [id])
        for (const item of items) {
          const itemId = `ri-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
          await requestRepository.createItem(
            {
              id: itemId,
              requestId: id,
              belongingId: item.belongingId || null,
              category: item.category || 'Other',
              description: item.description ? item.description.trim() : 'Item',
              serialNumber: item.serialNumber ? item.serialNumber.trim() : null,
              quantity: Number(item.quantity) || 1,
            },
            client,
          )
        }
      }

      if (student && updated.student_id) {
        await client.query(
          `UPDATE users SET
            name = COALESCE($1, name),
            student_id = COALESCE($2, student_id),
            department = COALESCE($3, department),
            phone = COALESCE($4, phone),
            address = COALESCE($5, address),
            subcity = COALESCE($6, subcity),
            woreda = COALESCE($7, woreda),
            updated_at = NOW()
          WHERE id = $8`,
          [
            student.name?.trim() || null,
            student.studentId?.trim() || null,
            student.department?.trim() || null,
            student.phone?.trim() || null,
            student.address?.trim() || null,
            student.subcity?.trim() || null,
            student.woreda?.trim() || null,
            updated.student_id,
          ],
        )
      }

      await client.query('COMMIT')
      const fullRow = await requestRepository.findById(id)
      const newItems = await requestRepository.findItemsByRequestId(id)
      return formatExitRequest(fullRow || updated, newItems.map(formatRequestItem))
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}

export default requestService

import { gateRepository } from '../repositories/gateRepository.js'
import { belongingRepository } from '../repositories/belongingRepository.js'
import { requestRepository } from '../repositories/requestRepository.js'
import { formatGateLog } from '../models/gateLogModel.js'
import { pool } from '../config/db.js'

export const gateService = {
  async getAllGateLogs(filters) {
    const rows = await gateRepository.findAll(filters)
    return rows.map(formatGateLog)
  },

  async recordEntry({ studentId, guardId, gate, returningIds = [], newItems = [], note = '' }) {
    if (!studentId) throw new Error('Student ID is required.')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Activate returning belongings
      if (Array.isArray(returningIds) && returningIds.length > 0) {
        await belongingRepository.updateStatusBulk(returningIds, 'active', client)
      }

      // 2. Register new belongings
      const createdBelongings = []
      if (Array.isArray(newItems) && newItems.length > 0) {
        for (const item of newItems) {
          const newId = `b-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
          const ins = await belongingRepository.create(
            {
              id: newId,
              studentId,
              category: item.category || 'Other',
              description: item.description ? item.description.trim() : 'Item',
              brand: item.brand ? item.brand.trim() : null,
              serialNumber: item.serialNumber ? item.serialNumber.trim() : null,
              color: item.color ? item.color.trim() : null,
              status: 'active',
              registeredBy: guardId || null,
            },
            client,
          )
          createdBelongings.push(ins)
        }
      }

      // 3. Build snapshot of items for permanent gate record
      let returningRows = []
      if (returningIds.length > 0) {
        returningRows = await belongingRepository.findByIds(returningIds, client)
      }

      const allLoggedItems = [
        ...returningRows.map((b) => ({
          category: b.category,
          description: b.description,
          serialNumber: b.serial_number || '',
          quantity: 1,
        })),
        ...createdBelongings.map((b) => ({
          category: b.category,
          description: b.description,
          serialNumber: b.serial_number || '',
          quantity: 1,
        })),
      ]

      // 4. Create gate log entry
      const logId = `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const logRow = await gateRepository.create(
        {
          id: logId,
          type: 'entry',
          studentId,
          guardId: guardId || null,
          gate: gate || 'Main Gate',
          requestId: null,
          note: (note || '').trim(),
          items: allLoggedItems,
        },
        client,
      )

      await client.query('COMMIT')
      return {
        log: formatGateLog(logRow),
        itemsRecorded: allLoggedItems.length,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  async allowExit({ requestId, guardId, gate, note = '' }) {
    if (!requestId) throw new Error('Exit Request ID is required.')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const exitReq = await requestRepository.findById(requestId)
      if (!exitReq) throw new Error('Exit request not found.')

      const requestItems = await requestRepository.findItemsByRequestId(requestId)

      // Mark request completed
      await requestRepository.complete(requestId, guardId, client)

      // Deactivate belongings being taken off-campus
      const belongingIds = requestItems.map((i) => i.belonging_id).filter(Boolean)
      if (belongingIds.length > 0) {
        await belongingRepository.updateStatusBulk(belongingIds, 'inactive', client)
      }

      // Snapshot items
      const snapshotItems = requestItems.map((i) => ({
        category: i.category || 'Item',
        description: i.description,
        serialNumber: i.serial_number || '',
        quantity: i.quantity || 1,
      }))

      const logId = `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const logRow = await gateRepository.create(
        {
          id: logId,
          type: 'exit',
          studentId: exitReq.student_id,
          guardId: guardId || null,
          gate: gate || 'Main Gate',
          requestId,
          note: (note || '').trim(),
          items: snapshotItems,
        },
        client,
      )

      await client.query('COMMIT')
      return {
        log: formatGateLog(logRow),
        code: exitReq.code,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  async denyExit({ requestId, guardId, gate, reason = '', studentId, items = [] }) {
    let targetStudentId = studentId
    let targetItems = items

    if (requestId) {
      const exitReq = await requestRepository.findById(requestId)
      if (exitReq) {
        targetStudentId = exitReq.student_id
        const reqItems = await requestRepository.findItemsByRequestId(requestId)
        targetItems = reqItems.map((i) => ({
          category: i.category || 'Item',
          description: i.description,
          serialNumber: i.serial_number || '',
          quantity: i.quantity || 1,
        }))
      }
    }

    if (!targetStudentId) {
      throw new Error('Student ID or valid Request ID is required.')
    }

    const logId = `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const logRow = await gateRepository.create({
      id: logId,
      type: 'denied',
      studentId: targetStudentId,
      guardId: guardId || null,
      gate: gate || 'Main Gate',
      requestId: requestId || null,
      note: (reason || '').trim(),
      items: targetItems || [],
    })

    return formatGateLog(logRow)
  },
}

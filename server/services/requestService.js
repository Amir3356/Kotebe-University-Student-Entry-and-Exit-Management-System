import { requestRepository } from '../repositories/requestRepository.js'
import { formatExitRequest, formatRequestItem } from '../models/requestModel.js'
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

  async createRequest({ studentId, reason, destination, departureDate, returnDate, items }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const year = new Date().getFullYear()
      const count = await requestRepository.countByCodePrefix(`EXR-${year}-`, client)
      const code = `EXR-${year}-${String(count + 1).padStart(4, '0')}`
      const requestId = `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

      const created = await requestRepository.create(
        {
          id: requestId,
          code,
          studentId,
          reason: reason.trim(),
          destination: destination.trim(),
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

    const items = await requestRepository.findItemsByRequestId(id)
    return formatExitRequest(updated, items.map(formatRequestItem))
  },

  async cancelRequest(id) {
    const updated = await requestRepository.cancel(id)
    if (!updated) {
      throw new Error('Cannot cancel request (must be in pending status).')
    }

    const items = await requestRepository.findItemsByRequestId(id)
    return formatExitRequest(updated, items.map(formatRequestItem))
  },
}

export default requestService

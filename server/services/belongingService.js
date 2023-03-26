import { belongingRepository } from '../repositories/belongingRepository.js'
import { formatBelonging } from '../models/belongingModel.js'

export const belongingService = {
  async getAllBelongings(filters) {
    const rows = await belongingRepository.findAll(filters)
    return rows.map(formatBelonging)
  },

  async getBelongingById(id) {
    const row = await belongingRepository.findById(id)
    if (!row) throw new Error('Belonging record not found.')
    return formatBelonging(row)
  },

  async createBelonging({ studentId, category, description, brand, serialNumber, color, registeredBy }) {
    const id = `b-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const created = await belongingRepository.create({
      id,
      studentId,
      category: category || 'Other',
      description: description.trim(),
      brand: brand ? brand.trim() : null,
      serialNumber: serialNumber ? serialNumber.trim() : null,
      color: color ? color.trim() : null,
      status: 'active',
      registeredBy: registeredBy || null,
    })
    return formatBelonging(created)
  },

  async updateBelonging(id, data) {
    const updated = await belongingRepository.update(id, data)
    if (!updated) throw new Error('Belonging record not found.')
    return formatBelonging(updated)
  },

  async toggleBelongingStatus(id) {
    const item = await belongingRepository.findById(id)
    if (!item) throw new Error('Belonging record not found.')

    const nextStatus = item.status === 'active' ? 'inactive' : 'active'
    const updated = await belongingRepository.updateStatus(id, nextStatus)
    return formatBelonging(updated)
  },

  async deleteBelonging(id) {
    const deleted = await belongingRepository.delete(id)
    if (!deleted) throw new Error('Belonging record not found.')
    return { ok: true }
  },
}

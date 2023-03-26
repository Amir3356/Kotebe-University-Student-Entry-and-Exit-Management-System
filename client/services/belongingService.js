import { belongingApi } from '../api'
import { uid } from '../utils/format'
import { BELONGING_STATUSES } from '../models'

export const belongingService = {
  /**
   * Processes new items registered at gate or student dashboard.
   */
  createBelongingItems(newItems, studentId, registeredById) {
    const timestamp = new Date().toISOString()
    return newItems.map((item) => ({
      id: uid('b'),
      studentId,
      category: item.category || 'Other',
      description: (item.description || '').trim(),
      brand: (item.brand || '').trim(),
      serialNumber: (item.serialNumber || '').trim(),
      color: (item.color || '').trim(),
      status: BELONGING_STATUSES.ACTIVE,
      registeredBy: registeredById,
      registeredAt: timestamp,
    }))
  },

  /**
   * Toggles belonging status.
   */
  async toggleStatus(belongingId) {
    belongingApi.toggleBelongingStatus(belongingId).catch(() => {})
  },

  /**
   * Deletes belonging.
   */
  async deleteBelonging(belongingId) {
    belongingApi.deleteBelonging(belongingId).catch(() => {})
  },
}

export default belongingService

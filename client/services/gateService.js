import { gateApi } from '../api'
import { uid } from '../utils/format'
import { snapshotItem, GATE_LOG_TYPES } from '../models'

export const gateService = {
  /**
   * Processes guard entry recording.
   */
  processEntry({ studentId, guardId, gate = 'Main Gate', returningIds = [], createdItems = [], note = '' }) {
    const timestamp = new Date().toISOString()
    const log = {
      id: uid('g'),
      type: GATE_LOG_TYPES.ENTRY,
      studentId,
      guardId,
      gate,
      timestamp,
      requestId: null,
      note: (note || '').trim(),
      items: createdItems.map(snapshotItem),
    }

    gateApi.recordEntry({
      studentId,
      guardId,
      gate,
      returningIds,
      newItems: createdItems,
      note,
    }).catch(() => {})

    return log
  },

  /**
   * Processes verified exit when belongings match approved request.
   */
  processExit({ request, guardId, gate = 'Main Gate', note = '' }) {
    const timestamp = new Date().toISOString()
    const log = {
      id: uid('g'),
      type: GATE_LOG_TYPES.EXIT,
      studentId: request.studentId,
      guardId,
      gate,
      timestamp,
      requestId: request.id,
      note: (note || '').trim(),
      items: request.items.map(snapshotItem),
    }

    gateApi.allowExit({
      requestId: request.id,
      guardId,
      gate,
      note,
    }).catch(() => {})

    return { log, timestamp }
  },

  /**
   * Processes denied exit when items don't match.
   */
  processDenial({ request, guardId, gate = 'Main Gate', reason = '' }) {
    const timestamp = new Date().toISOString()
    const log = {
      id: uid('g'),
      type: GATE_LOG_TYPES.DENIED,
      studentId: request.studentId,
      guardId,
      gate,
      timestamp,
      requestId: request.id,
      note: (reason || '').trim(),
      items: request.items.map(snapshotItem),
    }

    gateApi.denyExit({
      requestId: request.id,
      guardId,
      gate,
      reason,
    }).catch(() => {})

    return log
  },
}

export default gateService

import { requestApi } from '../api'
import { uid } from '../utils/format'
import { nextRequestCode, snapshotItem, REQUEST_STATUSES, exitRequestSchema } from '../models'

export const requestService = {
  /**
   * Validates and constructs a new exit request model using Zod.
   */
  buildExitRequest({ reason, destination, departureDate, returnDate, items, studentId, existingRequests = [] }) {
    // Validate request payload using Zod schema
    const validation = exitRequestSchema.safeParse({
      reason,
      destination,
      departureDate,
      returnDate,
      items,
      studentId,
    })

    if (!validation.success) {
      const firstIssue = validation.error.issues[0]
      throw new Error(firstIssue?.message || 'Validation error in exit request.')
    }

    const now = new Date().toISOString()
    const code = nextRequestCode(existingRequests)

    const request = {
      id: uid('r'),
      code,
      studentId,
      reason: reason.trim(),
      destination: destination.trim(),
      departureDate,
      returnDate,
      items: items.map((item) => ({
        id: uid('ri'),
        belongingId: item.belongingId ?? null,
        ...snapshotItem(item),
      })),
      status: REQUEST_STATUSES.PENDING,
      createdAt: now,
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: '',
      verifiedBy: null,
      exitedAt: null,
    }

    requestApi.createExitRequest({
      reason,
      destination,
      departureDate,
      returnDate,
      items,
      studentId,
    }).catch(() => {})

    return request
  },

  /**
   * Reviews request (proctor decision).
   */
  reviewRequest(requestId, decision, note, reviewerId) {
    requestApi.reviewRequest(requestId, decision, note, reviewerId).catch(() => {})
  },

  /**
   * Cancels a pending request.
   */
  cancelRequest(requestId) {
    requestApi.cancelRequest(requestId).catch(() => {})
  },
}

export default requestService

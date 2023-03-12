// Model: The representation of your data (exit_requests & exit_request_items tables)

export const ExitRequest = {
  tableName: 'exit_requests',
  itemsTableName: 'exit_request_items',

  statuses: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],

  fromRow(row, items = []) {
    if (!row) return null
    return {
      id: row.id,
      code: row.code,
      studentId: row.student_id,
      reason: row.reason,
      destination: row.destination,
      departureDate: row.departure_date,
      returnDate: row.return_date,
      status: row.status,
      createdAt: row.created_at,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note,
      verifiedBy: row.verified_by,
      exitedAt: row.exited_at,
      items,
    }
  },

  fromItemRow(row) {
    if (!row) return null
    return {
      id: row.id,
      belongingId: row.belonging_id || row.belongingId || null,
      category: row.category || 'Item',
      description: row.description,
      serialNumber: row.serial_number || row.serialNumber || '',
      quantity: row.quantity || 1,
    }
  },
}

// Backwards-compatible exports
export const formatExitRequest = ExitRequest.fromRow
export const formatRequestItem = ExitRequest.fromItemRow
export const REQUEST_STATUSES = ExitRequest.statuses

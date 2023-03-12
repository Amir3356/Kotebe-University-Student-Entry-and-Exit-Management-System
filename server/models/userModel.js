// Model: The representation of your data (users table)

export const User = {
  tableName: 'users',

  roles: ['student', 'guard', 'proctor'],
  statuses: ['active', 'inactive'],
  approvalStatuses: ['approve', 'pending', 'reject'],

  /**
   * Transforms raw database record into formatted domain model
   */
  fromRow(row) {
    if (!row) return null
    return {
      id: row.id,
      role: row.role,
      name: row.name,
      username: row.username,
      email: row.email,
      phone: row.phone,
      studentId: row.student_id,
      department: row.department,
      address: row.address,
      subcity: row.subcity,
      woreda: row.woreda,
      year: row.year,
      dorm: row.dorm,
      gate: row.gate,
      assignedBlocks: row.assigned_blocks,
      status: row.status,
      approvalStatus: row.approval_status,
      createdAt: row.created_at,
    }
  },
}

// Backwards-compatible export
export const formatUser = User.fromRow
export const ROLES = User.roles
export const STATUSES = User.statuses
export const APPROVAL_STATUSES = User.approvalStatuses

// Model: The representation of your data (belongings table)

export const Belonging = {
  tableName: 'belongings',

  categories: [
    'Laptop',
    'Desktop Computer',
    'Tablet',
    'Electronics',
    'Mobile Phone',
    'Clothing',
    'Other',
  ],

  statuses: ['active', 'inactive'],

  /**
   * Transforms raw database record into formatted domain model
   */
  fromRow(row) {
    if (!row) return null
    return {
      id: row.id,
      studentId: row.student_id,
      category: row.category,
      description: row.description,
      brand: row.brand || '',
      serialNumber: row.serial_number || '',
      color: row.color || '',
      status: row.status,
      registeredBy: row.registered_by,
      registeredAt: row.registered_at,
    }
  },
}

// Backwards-compatible exports
export const formatBelonging = Belonging.fromRow
export const ITEM_CATEGORIES = Belonging.categories

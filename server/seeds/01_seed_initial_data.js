import { users, belongings, exitRequests, gateLogs } from './seedData.js'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  console.log('🌱 Knex Seeding initial records...')

  // 1. Seed Users
  const userRecords = users
    .filter((u) => u.role !== 'admin')
    .map((u) => ({
      id: u.id,
      role: u.role,
      name: u.name,
      username: u.username,
      password: u.password || 'password123',
      email: u.email || null,
      phone: u.phone || null,
      student_id: u.studentId || null,
      department: u.department || null,
      address: u.address || null,
      subcity: u.subcity || null,
      woreda: u.woreda || null,
      year: u.year || 1,
      dorm: u.dorm || null,
      gate: u.gate || null,
      assigned_blocks: u.assignedBlocks || null,
      status: u.status || 'active',
      approval_status: u.approvalStatus || 'approve',
      created_at: u.createdAt || new Date().toISOString(),
    }))

  for (const record of userRecords) {
    await knex('users').insert(record).onConflict('id').ignore()
  }
  console.log(`✅ Seeded ${userRecords.length} users.`)

  // 2. Seed Belongings
  const belongingRecords = belongings.map((b) => ({
    id: b.id,
    student_id: b.studentId,
    category: b.category,
    description: b.description,
    brand: b.brand || null,
    serial_number: b.serialNumber || null,
    color: b.color || null,
    status: b.status === 'off_campus' || b.status === 'inactive' ? 'inactive' : 'active',
    registered_by: b.registeredBy || null,
    registered_at: b.registeredAt || new Date().toISOString(),
  }))

  for (const record of belongingRecords) {
    await knex('belongings').insert(record).onConflict('id').ignore()
  }
  console.log(`✅ Seeded ${belongingRecords.length} belongings.`)

  // 3. Seed Exit Requests & Items
  for (const r of exitRequests) {
    await knex('exit_requests')
      .insert({
        id: r.id,
        code: r.code,
        student_id: r.studentId,
        reason: r.reason,
        destination: r.destination,
        departure_date: r.departureDate,
        return_date: r.returnDate || null,
        status: r.status,
        created_at: r.createdAt,
        reviewed_by: r.reviewedBy || null,
        reviewed_at: r.reviewedAt || null,
        review_note: r.reviewNote || null,
        verified_by: r.verifiedBy || null,
        exited_at: r.exitedAt || null,
      })
      .onConflict('id')
      .ignore()

    if (Array.isArray(r.items)) {
      for (const item of r.items) {
        await knex('exit_request_items')
          .insert({
            id: item.id,
            request_id: r.id,
            belonging_id: item.belongingId || null,
            category: item.category || null,
            description: item.description,
            serial_number: item.serialNumber || null,
            quantity: item.quantity || 1,
          })
          .onConflict('id')
          .ignore()
      }
    }
  }
  console.log(`✅ Seeded ${exitRequests.length} exit requests.`)

  // 4. Seed Gate Logs
  for (const g of gateLogs) {
    await knex('gate_logs')
      .insert({
        id: g.id,
        type: g.type,
        student_id: g.studentId,
        guard_id: g.guardId || null,
        gate: g.gate,
        timestamp: g.timestamp,
        request_id: g.requestId || null,
        note: g.note || null,
        items: JSON.stringify(g.items || []),
      })
      .onConflict('id')
      .ignore()
  }
  console.log(`✅ Seeded ${gateLogs.length} gate logs.`)
}

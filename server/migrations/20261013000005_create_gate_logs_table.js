/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('gate_logs')
  if (!exists) {
    await knex.schema.createTable('gate_logs', (table) => {
      table.string('id', 50).primary()
      table.string('type', 20).notNullable()
      table
        .string('student_id', 50)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .string('guard_id', 50)
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('gate', 100).notNullable()
      table.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now())
      table
        .string('request_id', 50)
        .references('id')
        .inTable('exit_requests')
        .onDelete('SET NULL')
      table.text('note')
      table.jsonb('items').defaultTo('[]')

      table.index('timestamp', 'idx_gate_logs_timestamp')
      table.index('student_id', 'idx_gate_logs_student_id')
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('gate_logs')
}

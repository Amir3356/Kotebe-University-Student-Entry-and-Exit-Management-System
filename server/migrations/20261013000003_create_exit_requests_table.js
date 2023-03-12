/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('exit_requests')
  if (!exists) {
    await knex.schema.createTable('exit_requests', (table) => {
      table.string('id', 50).primary()
      table.string('code', 50).unique().notNullable()
      table
        .string('student_id', 50)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.text('reason').notNullable()
      table.string('destination', 255).notNullable()
      table.string('departure_date', 50).notNullable()
      table.string('return_date', 50)
      table.string('status', 20).defaultTo('pending')
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
      table
        .string('reviewed_by', 50)
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('reviewed_at', { useTz: true })
      table.text('review_note')
      table
        .string('verified_by', 50)
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('exited_at', { useTz: true })

      table.index('student_id', 'idx_exit_requests_student_id')
      table.index('status', 'idx_exit_requests_status')
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('exit_requests')
}

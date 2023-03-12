/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('belongings')
  if (!exists) {
    await knex.schema.createTable('belongings', (table) => {
      table.string('id', 50).primary()
      table
        .string('student_id', 50)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('category', 80).notNullable()
      table.string('description', 255).notNullable()
      table.string('brand', 100)
      table.string('serial_number', 100)
      table.string('color', 50)
      table.string('status', 20).defaultTo('active')
      table
        .string('registered_by', 50)
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('registered_at', { useTz: true }).defaultTo(knex.fn.now())

      table.index('student_id', 'idx_belongings_student_id')
      table.index('status', 'idx_belongings_status')
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('belongings')
}

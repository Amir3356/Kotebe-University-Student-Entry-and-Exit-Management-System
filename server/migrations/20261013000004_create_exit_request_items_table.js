/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('exit_request_items')
  if (!exists) {
    await knex.schema.createTable('exit_request_items', (table) => {
      table.string('id', 50).primary()
      table
        .string('request_id', 50)
        .notNullable()
        .references('id')
        .inTable('exit_requests')
        .onDelete('CASCADE')
      table
        .string('belonging_id', 50)
        .references('id')
        .inTable('belongings')
        .onDelete('SET NULL')
      table.string('category', 80)
      table.string('description', 255).notNullable()
      table.string('serial_number', 100)
      table.integer('quantity').defaultTo(1)

      table.index('request_id', 'idx_exit_request_items_request_id')
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('exit_request_items')
}

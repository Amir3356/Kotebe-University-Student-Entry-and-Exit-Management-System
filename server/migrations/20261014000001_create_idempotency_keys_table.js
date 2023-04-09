/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('idempotency_keys')
  if (!exists) {
    await knex.schema.createTable('idempotency_keys', (table) => {
      table.string('key', 255).primary()
      table.string('method', 10).notNullable()
      table.string('path', 255).notNullable()
      table.string('request_hash', 128)
      table.integer('status_code')
      table.text('response_body')
      table.string('status', 20).defaultTo('pending') // 'pending' | 'completed'
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
      table.timestamp('expires_at', { useTz: true })

      table.index('created_at', 'idx_idempotency_created_at')
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('idempotency_keys')
}

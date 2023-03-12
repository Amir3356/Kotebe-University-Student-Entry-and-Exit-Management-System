/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('users')
  if (!exists) {
    await knex.schema.createTable('users', (table) => {
      table.string('id', 50).primary()
      table.string('role', 20).notNullable()
      table.string('name', 120).notNullable()
      table.string('username', 60).unique().notNullable()
      table.string('password', 255).notNullable()
      table.string('email', 120)
      table.string('phone', 50)
      table.string('student_id', 50)
      table.string('department', 100)
      table.string('address', 255)
      table.string('subcity', 100)
      table.string('woreda', 50)
      table.integer('year').defaultTo(1)
      table.string('dorm', 100)
      table.string('gate', 100)
      table.string('assigned_blocks', 255)
      table.string('status', 20).defaultTo('active')
      table.string('approval_status', 20).defaultTo('approve')
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now())

      table.index('role', 'idx_users_role')
      table.index('username', 'idx_users_username')
      table.index('student_id', 'idx_users_student_id')
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users')
}

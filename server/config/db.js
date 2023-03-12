import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'kotebe_exit_entry_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_password',
    }

export const pool = new Pool(poolConfig)

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message)
})

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV === 'development') {
    // console.log('executed query', { text, duration, rows: res.rowCount })
  }
  return res
}

export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as database')
    console.log(`✅ Connected to PostgreSQL database "${res.rows[0].database}" at ${res.rows[0].current_time}`)
    return { ok: true, info: res.rows[0] }
  } catch (err) {
    console.warn(`⚠️ PostgreSQL connection warning: ${err.message}`)
    return { ok: false, error: err.message }
  }
}

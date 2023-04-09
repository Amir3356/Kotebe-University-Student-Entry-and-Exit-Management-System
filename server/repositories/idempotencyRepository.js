import { query } from '../config/db.js'

// In-memory fallback and fast concurrency lock
const memoryStore = new Map()

export const idempotencyRepository = {
  /**
   * Find an existing idempotency record by key
   */
  async findByKey(key) {
    try {
      const result = await query(
        `SELECT * FROM idempotency_keys WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
        [key],
      )
      if (result.rows.length > 0) {
        return result.rows[0]
      }
    } catch (err) {
      console.warn(`Idempotency DB lookup warning: ${err.message}`)
    }

    // Fallback to in-memory store
    return memoryStore.get(key) || null
  },

  /**
   * Try to register a new idempotency key.
   * Returns { created: true } if newly locked, or { created: false, existing } if already taken.
   */
  async lockKey({ key, method, path, requestHash }) {
    // Check in-memory fast lock first to handle concurrent requests arriving simultaneously
    if (memoryStore.has(key)) {
      return { created: false, existing: memoryStore.get(key) }
    }

    const pendingRecord = {
      key,
      method,
      path,
      request_hash: requestHash,
      status: 'pending',
      status_code: null,
      response_body: null,
      created_at: new Date().toISOString(),
    }

    memoryStore.set(key, pendingRecord)

    try {
      const result = await query(
        `INSERT INTO idempotency_keys (key, method, path, request_hash, status, created_at, expires_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW() + INTERVAL '24 hours')
         ON CONFLICT (key) DO NOTHING
         RETURNING *`,
        [key, method, path, requestHash],
      )

      if (result.rows.length > 0) {
        return { created: true, record: result.rows[0] }
      }

      // If conflicting row existed in DB, fetch it
      const existing = await this.findByKey(key)
      return { created: false, existing: existing || pendingRecord }
    } catch (err) {
      console.warn(`Idempotency DB insert warning: ${err.message}`)
      return { created: true, record: pendingRecord }
    }
  },

  /**
   * Complete the idempotency key with status code and serialized response body
   */
  async completeKey(key, statusCode, responseBody) {
    const serializedBody = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)

    // Update in-memory record
    const inMem = memoryStore.get(key)
    if (inMem) {
      inMem.status = 'completed'
      inMem.status_code = statusCode
      inMem.response_body = serializedBody
    }

    try {
      await query(
        `UPDATE idempotency_keys
         SET status_code = $1, response_body = $2, status = 'completed'
         WHERE key = $3`,
        [statusCode, serializedBody, key],
      )
    } catch (err) {
      console.warn(`Idempotency DB update warning: ${err.message}`)
    }
  },

  /**
   * Release or cancel a pending key if an unhandled internal exception occurred
   */
  async releaseKey(key) {
    memoryStore.delete(key)
    try {
      await query(`DELETE FROM idempotency_keys WHERE key = $1 AND status = 'pending'`, [key])
    } catch {
      // ignore cleanup errors
    }
  },
}

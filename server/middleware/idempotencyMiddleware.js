import crypto from 'crypto'
import { idempotencyRepository } from '../repositories/idempotencyRepository.js'

/**
 * Middleware providing idempotency protection against double clicks and network retries.
 * Reads 'Idempotency-Key' or 'X-Idempotency-Key' from request headers.
 */
export function idempotency(req, res, next) {
  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key']

  // Only apply if an idempotency key is provided and method is mutating (POST, PUT, PATCH)
  if (!rawKey || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next()
  }

  const key = String(rawKey).trim()
  if (!key || key.length > 255) {
    return res.status(400).json({
      error: 'Invalid Idempotency-Key header length. Must be between 1 and 255 characters.',
    })
  }

  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body || {}))
    .digest('hex')

  // Run async handler
  ;(async () => {
    try {
      const existing = await idempotencyRepository.findByKey(key)

      if (existing) {
        // If already completed, replay the stored response immediately
        if (existing.status === 'completed' && existing.status_code) {
          res.setHeader('Idempotency-Replayed', 'true')
          res.status(existing.status_code)
          try {
            const parsed = JSON.parse(existing.response_body)
            return res.json(parsed)
          } catch {
            return res.send(existing.response_body)
          }
        }

        // If currently in-flight (e.g. rapid double-click while first request is executing), wait up to 3 seconds
        let attempts = 0
        while (attempts < 30) {
          await new Promise((r) => setTimeout(r, 100))
          attempts++
          const poll = await idempotencyRepository.findByKey(key)
          if (poll && poll.status === 'completed' && poll.status_code) {
            res.setHeader('Idempotency-Replayed', 'true')
            res.status(poll.status_code)
            try {
              const parsed = JSON.parse(poll.response_body)
              return res.json(parsed)
            } catch {
              return res.send(poll.response_body)
            }
          }
        }

        return res.status(409).json({
          error: 'A request with this Idempotency-Key is currently being processed. Please wait.',
        })
      }

      // Lock key for the current request
      const lock = await idempotencyRepository.lockKey({
        key,
        method: req.method,
        path: req.originalUrl || req.path,
        requestHash,
      })

      if (!lock.created && lock.existing?.status === 'completed') {
        res.setHeader('Idempotency-Replayed', 'true')
        res.status(lock.existing.status_code)
        try {
          return res.json(JSON.parse(lock.existing.response_body))
        } catch {
          return res.send(lock.existing.response_body)
        }
      }

      // Intercept res.send / res.json to capture response
      const originalSend = res.send.bind(res)
      const originalJson = res.json.bind(res)

      res.send = function (body) {
        if (res.statusCode < 500) {
          idempotencyRepository.completeKey(key, res.statusCode, body).catch(() => {})
        } else {
          idempotencyRepository.releaseKey(key).catch(() => {})
        }
        return originalSend(body)
      }

      res.json = function (body) {
        if (res.statusCode < 500) {
          idempotencyRepository.completeKey(key, res.statusCode, body).catch(() => {})
        } else {
          idempotencyRepository.releaseKey(key).catch(() => {})
        }
        return originalJson(body)
      }

      next()
    } catch (err) {
      console.error('Idempotency middleware error:', err)
      await idempotencyRepository.releaseKey(key).catch(() => {})
      next()
    }
  })()
}

export default idempotency

// Middleware: The security guard (Zod Input Validation)
// Validates request payloads against strict Zod schemas before handing off to controllers.

/**
 * Validates request body using a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      const primaryMessage = issues[0]?.message || 'Validation error'

      return res.status(400).json({
        ok: false,
        error: primaryMessage,
        details: issues,
      })
    }

    // Replace req.body with parsed & sanitized data from Zod
    req.body = result.data
    next()
  }
}

/**
 * Validates query parameters using a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))

      return res.status(400).json({
        ok: false,
        error: issues[0]?.message || 'Query validation error',
        details: issues,
      })
    }

    req.query = result.data
    next()
  }
}

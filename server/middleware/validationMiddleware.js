// Middleware: The security guard (Input Validation)
// Validates request body structure before handing off to the controller.

export function validateRequiredFields(fields) {
  return (req, res, next) => {
    const missing = []
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || String(req.body[field]).trim() === '') {
        missing.push(field)
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        ok: false,
        error: `Validation error: Missing required fields: [${missing.join(', ')}].`,
      })
    }

    next()
  }
}

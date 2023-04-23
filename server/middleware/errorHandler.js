// Global error handling middleware

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode
  if (!statusCode) {
    const msg = (err.message || '').toLowerCase()
    if (msg.includes('not found')) {
      statusCode = 404
    } else if (
      msg.includes('invalid credentials') ||
      msg.includes('invalid username or password') ||
      msg.includes('unauthorized') ||
      msg.includes('authentication required')
    ) {
      statusCode = 401
    } else if (
      msg.includes('disabled') ||
      msg.includes('forbidden') ||
      msg.includes('inactive') ||
      msg.includes('deactivated')
    ) {
      statusCode = 403
    } else {
      statusCode = 400
    }
  }

  // Only log unexpected server internal errors (>= 500) to the server console
  if (statusCode >= 500) {
    console.error('Unhandled Server Error (500):', err)
  }

  res.status(statusCode).json({
    ok: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  })
}

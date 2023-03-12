// Global error handling middleware

export function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err)

  const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400)

  res.status(statusCode).json({
    ok: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

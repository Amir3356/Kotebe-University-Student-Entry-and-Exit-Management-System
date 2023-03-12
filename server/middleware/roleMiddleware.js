// Middleware: The security guard (Role-Based Authorization)
// Verifies that the user attempting the action possesses the required role.

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // If no user is attached, allow testing if in development, or require authentication
    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        return next() // Dev mode convenience
      }
      return res.status(401).json({
        ok: false,
        error: 'Authentication required to access this resource.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        error: `Access denied: Requires one of the following roles: [${allowedRoles.join(', ')}].`,
      })
    }

    next()
  }
}

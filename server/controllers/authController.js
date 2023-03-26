import { authService } from '../services/authService.js'

export async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body)
    return res.json({
      ok: true,
      token,
      user,
      message: `Signed in successfully as ${user.name}.`,
    })
  } catch (err) {
    next(err)
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    // If authenticated via JWT middleware, return req.user directly
    if (req.user) {
      return res.json({ ok: true, user: req.user })
    }

    const userId = req.query.id || req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Authentication required.' })
    }

    const user = await authService.getCurrentUser(userId)
    return res.json({ ok: true, user })
  } catch (err) {
    next(err)
  }
}

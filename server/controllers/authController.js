import { authService } from '../services/authService.js'

export async function login(req, res, next) {
  try {
    const user = await authService.login(req.body)
    return res.json({
      ok: true,
      user,
      message: `Signed in successfully as ${user.name}.`,
    })
  } catch (err) {
    next(err)
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.query.id)
    return res.json({ ok: true, user })
  } catch (err) {
    next(err)
  }
}

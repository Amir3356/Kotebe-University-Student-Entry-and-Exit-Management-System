import { userService } from '../services/userService.js'

export async function getUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers(req.query)
    return res.json(users)
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id)
    return res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function saveUser(req, res, next) {
  try {
    const user = await userService.saveUser({ ...req.body, id: req.params.id || req.body.id })
    const status = req.params.id || req.body.id ? 200 : 201
    return res.status(status).json({ ok: true, user })
  } catch (err) {
    next(err)
  }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const user = await userService.toggleUserStatus(req.params.id)
    return res.json({ ok: true, user })
  } catch (err) {
    next(err)
  }
}

export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id)
    return res.json({ ok: true, message: 'User deleted successfully.' })
  } catch (err) {
    next(err)
  }
}

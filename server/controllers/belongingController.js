import { belongingService } from '../services/belongingService.js'

export async function getBelongings(req, res, next) {
  try {
    const belongings = await belongingService.getAllBelongings(req.query)
    return res.json(belongings)
  } catch (err) {
    next(err)
  }
}

export async function getBelongingById(req, res, next) {
  try {
    const belonging = await belongingService.getBelongingById(req.params.id)
    return res.json(belonging)
  } catch (err) {
    next(err)
  }
}

export async function createBelonging(req, res, next) {
  try {
    const belonging = await belongingService.createBelonging(req.body)
    return res.status(201).json({ ok: true, belonging })
  } catch (err) {
    next(err)
  }
}

export async function updateBelonging(req, res, next) {
  try {
    const belonging = await belongingService.updateBelonging(req.params.id, req.body)
    return res.json({ ok: true, belonging })
  } catch (err) {
    next(err)
  }
}

export async function toggleBelongingStatus(req, res, next) {
  try {
    const belonging = await belongingService.toggleBelongingStatus(req.params.id)
    return res.json({ ok: true, belonging })
  } catch (err) {
    next(err)
  }
}

export async function deleteBelonging(req, res, next) {
  try {
    await belongingService.deleteBelonging(req.params.id)
    return res.json({ ok: true, message: 'Belonging record deleted.' })
  } catch (err) {
    next(err)
  }
}

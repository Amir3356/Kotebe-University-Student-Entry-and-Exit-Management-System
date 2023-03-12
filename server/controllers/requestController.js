import { requestService } from '../services/requestService.js'

export async function getExitRequests(req, res, next) {
  try {
    const requests = await requestService.getAllRequests(req.query)
    return res.json(requests)
  } catch (err) {
    next(err)
  }
}

export async function getExitRequestById(req, res, next) {
  try {
    const request = await requestService.getRequestById(req.params.id)
    return res.json(request)
  } catch (err) {
    next(err)
  }
}

export async function createExitRequest(req, res, next) {
  try {
    const request = await requestService.createRequest(req.body)
    return res.status(201).json({ ok: true, request })
  } catch (err) {
    next(err)
  }
}

export async function reviewRequest(req, res, next) {
  try {
    const { decision, note, reviewedBy } = req.body
    const request = await requestService.reviewRequest(req.params.id, decision, note, reviewedBy)
    return res.json({ ok: true, request })
  } catch (err) {
    next(err)
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const request = await requestService.cancelRequest(req.params.id)
    return res.json({ ok: true, request })
  } catch (err) {
    next(err)
  }
}

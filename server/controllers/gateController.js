import { gateService } from '../services/gateService.js'
import { wsEvents } from '../config/socket.js'

export async function getGateLogs(req, res, next) {
  try {
    const logs = await gateService.getAllGateLogs(req.query)
    return res.json(logs)
  } catch (err) {
    next(err)
  }
}

export async function recordEntry(req, res, next) {
  try {
    const result = await gateService.recordEntry(req.body)
    wsEvents.gateActivity(result.log)
    return res.status(201).json({
      ok: true,
      log: result.log,
      itemsRecorded: result.itemsRecorded,
    })
  } catch (err) {
    next(err)
  }
}

export async function allowExit(req, res, next) {
  try {
    const result = await gateService.allowExit(req.body)
    wsEvents.gateActivity(result.log)
    return res.json({
      ok: true,
      log: result.log,
      message: `Exit authorized for request ${result.code}.`,
    })
  } catch (err) {
    next(err)
  }
}

export async function denyExit(req, res, next) {
  try {
    const log = await gateService.denyExit(req.body)
    wsEvents.gateActivity(log)
    return res.json({
      ok: true,
      log,
      message: 'Exit denied and recorded in gate audit.',
    })
  } catch (err) {
    next(err)
  }
}

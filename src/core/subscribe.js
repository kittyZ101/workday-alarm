// 无状态订阅：把排班配置编码进订阅链接，服务端当场生成 .ics，无需存文件。
import { buildSchedule } from './schedule.js'
import { genIcs } from './ics.js'
import { decodeConfig } from './shareCode.js'

export function icsFromPayload(payload, options = {}) {
  const config = decodeConfig(payload)
  return genIcsFromConfig(config, options)
}

export function genIcsFromConfig(config, options = {}) {
  const schedule = buildSchedule(config)
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 2, 11, 31)
  return genIcs(schedule, start, end, options)
}

// 兼容 Express 与 Vercel 的 res：只用 statusCode / setHeader / end
export function sendIcs(res, payload, options = {}) {
  let ics
  try {
    ics = icsFromPayload(payload, options)
  } catch (e) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('invalid payload')
    return
  }
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="workday-alarm.ics"')
  res.setHeader('Cache-Control', 'no-cache')
  res.end(ics)
}

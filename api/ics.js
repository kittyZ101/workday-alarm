import { sendIcs } from '../src/core/subscribe.js'

// Vercel Serverless Function：GET /api/ics?d=<encodedConfig> 返回 .ics
export default async function handler(req, res) {
  const payload = req.query.d || req.query.c
  if (!payload) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('missing d')
    return
  }
  sendIcs(res, payload)
}

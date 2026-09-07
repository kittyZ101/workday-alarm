import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { buildSchedule } from './src/core/schedule.js'
import { genIcs } from './src/core/ics.js'
import { sendIcs } from './src/core/subscribe.js'
import { allOfficialDates } from './src/core/holidays.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'schedules.json')

const app = express()
app.use(express.json({ limit: '256kb' }))

function ensureDataDir() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
}

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeStore(store) {
  ensureDataDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2))
}

function normalizeConfig(body = {}) {
  const year = Number(body.year) || 2026
  const official = allOfficialDates()
  return {
    mode: ['double', 'single', 'alternating'].includes(body.mode) ? body.mode : 'double',
    refMonday: typeof body.refMonday === 'string' ? body.refMonday : '2026-09-07',
    refIsSmall: !!body.refIsSmall,
    year,
    holidays: Array.isArray(body.holidays) ? body.holidays : [...official.holidays],
    makeupWorkdays: Array.isArray(body.makeupWorkdays) ? body.makeupWorkdays : [...official.workdays],
    overrides: body.overrides && typeof body.overrides === 'object' ? body.overrides : {}
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.post('/api/schedules', (req, res) => {
  const config = normalizeConfig(req.body)
  const code = crypto.randomBytes(4).toString('hex')
  const token = crypto.randomBytes(8).toString('hex')
  const store = readStore()
  store[code] = { config, token, createdAt: Date.now(), updatedAt: Date.now() }
  writeStore(store)
  res.json({ code, shareUrl: `#/?code=${code}`, icsUrl: `/ics/${code}.ics`, token, config })
})

app.get('/api/schedules/:code', (req, res) => {
  const item = readStore()[req.params.code]
  if (!item) return res.status(404).json({ error: '未找到该分享' })
  res.json({ code: req.params.code, config: item.config, updatedAt: item.updatedAt })
})

app.put('/api/schedules/:code', (req, res) => {
  const store = readStore()
  const item = store[req.params.code]
  if (!item) return res.status(404).json({ error: '未找到该分享' })
  if (!req.body.token || req.body.token !== item.token) {
    return res.status(403).json({ error: '没有编辑权限（口令错误）' })
  }
  item.config = normalizeConfig(req.body)
  item.updatedAt = Date.now()
  writeStore(store)
  res.json({ code: req.params.code, config: item.config, updatedAt: item.updatedAt })
})

app.get('/ics/:code.ics', (req, res) => {
  const item = readStore()[req.params.code]
  if (!item) return res.status(404).send('not found')
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 2, 11, 31)
  const schedule = buildSchedule(item.config)
  const ics = genIcs(schedule, start, end, { name: '上班脑工作日历' })
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="workday-${req.params.code}.ics"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.send(ics)
})

// 无状态订阅：/ics?d=<encodedConfig>，Vercel 与本地一致
app.get('/ics', (req, res) => {
  const payload = req.query.d || req.query.c
  if (!payload) return res.status(400).send('missing d')
  const options = req.query.alarm ? { onlyWork: true, name: '上班脑闹钟' } : {}
  sendIcs(res, payload, options)
})

// 生产模式：托管 dist 静态文件
const distDir = path.join(__dirname, 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/ics/')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`上班脑服务已启动：http://localhost:${PORT}`)
})

import { reactive } from 'vue'
import { buildSchedule } from './core/schedule.js'
import { HOLIDAY_YEARS } from './core/holidays.js'

const STORAGE_KEY = 'workday-alarm-config-v1'

function baseline() {
  return {
    mode: 'double',
    refMonday: '2026-09-07',
    refIsSmall: false,
    year: 2026,
    holidays: [...HOLIDAY_YEARS[2026].holidays],
    makeupWorkdays: [...HOLIDAY_YEARS[2026].workdays],
    overrides: {} // { 'YYYY-MM-DD': 'work' | 'rest' }
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return baseline()
    const parsed = JSON.parse(raw)
    return { ...baseline(), ...parsed, overrides: parsed.overrides || {} }
  } catch {
    return baseline()
  }
}

function persist(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export const store = reactive({
  config: load(),
  loadedCode: null,
  setConfig(config) {
    this.config = { ...baseline(), ...config, overrides: config.overrides || {} }
    persist(this.config)
  },
  async loadShared(code) {
    const res = await fetch(`/api/schedules/${code}`)
    if (!res.ok) throw new Error('分享不存在或已失效')
    const data = await res.json()
    this.setConfig(data.config)
    this.loadedCode = code
  },
  update(patch) {
    Object.assign(this.config, patch)
    persist(this.config)
  },
  addOverride(date, type) {
    this.config.overrides[date] = type
    persist(this.config)
  },
  removeOverride(date) {
    delete this.config.overrides[date]
    persist(this.config)
  },
  reset() {
    this.config = baseline()
    this.loadedCode = null
    persist(this.config)
  },
  get schedule() {
    return buildSchedule(this.config)
  }
})

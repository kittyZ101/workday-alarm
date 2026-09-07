import { reactive } from 'vue'
import { buildSchedule } from './core/schedule.js'
import { HOLIDAY_YEARS } from './core/holidays.js'

const STORAGE_KEY = 'workday-alarm-config-v1'
const OWNED_KEY = 'workday-alarm-owned-code-v1'
// 打开「别人的分享排班」前，先把“我自己的排班”备份一份，方便一键恢复。
const PREV_KEY = 'workday-alarm-prev-config-v1'

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

function loadOwnedCode() {
  try {
    const raw = localStorage.getItem(OWNED_KEY)
    if (!raw) return { code: null, token: null }
    return JSON.parse(raw)
  } catch {
    return { code: null, token: null }
  }
}

export const store = reactive({
  config: load(),
  loadedCode: null,     // 当前显示的订阅码（可能是别人的）
  ownedCode: loadOwnedCode().code, // 本设备自己创建的订阅码（拥有编辑权）
  ownedToken: loadOwnedCode().token, // 编辑口令，仅创建者持有
  prevOwnConfig: null,  // 打开分享排班前的“自己的排班”，用于恢复

  get isOwner() {
    return !!(this.loadedCode && this.ownedCode && this.ownedCode === this.loadedCode)
  },
  get isViewingShared() {
    return !!(this.loadedCode && this.ownedCode !== this.loadedCode)
  },

  setConfig(config) {
    this.config = { ...baseline(), ...config, overrides: config.overrides || {} }
    persist(this.config)
  },

  // 打开某个分享码（后端存储版）
  async loadShared(code) {
    const res = await fetch(`/api/schedules/${code}`)
    if (!res.ok) throw new Error('分享不存在或已失效')
    const data = await res.json()
    if (this.ownedCode !== code) this.backupOwn()
    this.setConfig(data.config)
    this.loadedCode = code
  },

  // 打开静态分享链接（配置直接编码在 URL 里，无后端 code）
  loadStatic(config) {
    this.backupOwn()
    this.setConfig(config)
    this.loadedCode = '__static__'
  },

  // 把自己现有的排班存一份，便于打开别人分享后恢复
  backupOwn() {
    if (!this.isViewingShared) {
      this.prevOwnConfig = JSON.parse(JSON.stringify(this.config))
      try { localStorage.setItem(PREV_KEY, JSON.stringify(this.prevOwnConfig)) } catch {}
    }
  },

  // 一旦用户开始改排班，就自动“变成他自己的”，与分享源脱钩（不覆盖对方）
  _unlinkIfForeign() {
    if (this.isViewingShared) this.loadedCode = null
  },

  update(patch) {
    Object.assign(this.config, patch)
    persist(this.config)
    this._unlinkIfForeign()
  },
  addOverride(date, type) {
    this.config.overrides[date] = type
    persist(this.config)
    this._unlinkIfForeign()
  },
  removeOverride(date) {
    delete this.config.overrides[date]
    persist(this.config)
    this._unlinkIfForeign()
  },

  // 生成了自己的订阅码 → 成为该订阅的主人（拥有编辑权）
  markOwned(code, token = '') {
    this.loadedCode = code
    this.ownedCode = code
    this.ownedToken = token
    try { localStorage.setItem(OWNED_KEY, JSON.stringify({ code, token })) } catch {}
  },

  // 把当前（别人的）排班固定成自己的
  adoptShared() {
    this.loadedCode = null
    this.prevOwnConfig = null
    try { localStorage.removeItem(PREV_KEY) } catch {}
  },

  // 恢复打开分享链接前的“自己的排班”
  restoreOwn() {
    if (!this.prevOwnConfig) return
    this.setConfig(this.prevOwnConfig)
    this.loadedCode = null
    this.prevOwnConfig = null
    try { localStorage.removeItem(PREV_KEY) } catch {}
  },

  reset() {
    this.config = baseline()
    this.loadedCode = null
    this.ownedCode = null
    this.ownedToken = null
    this.prevOwnConfig = null
    try {
      localStorage.removeItem(OWNED_KEY)
      localStorage.removeItem(PREV_KEY)
    } catch {}
    persist(this.config)
  },

  get schedule() {
    return buildSchedule(this.config)
  }
})

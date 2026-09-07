// 排班核心：把“公司规则 + 法定调休 + 手动纠正”合成最终的上/休班判断。

export const MODES = [
  { key: 'double', label: '双休', desc: '周一至周五上班，周六日休息' },
  { key: 'single', label: '单休', desc: '周一至周六上班，周日休息' },
  { key: 'alternating', label: '大小周', desc: '一周双休、下一周单休，交替进行' }
]

export function buildSchedule(config) {
  const mode = config.mode || 'double'
  const refMonday = config.refMonday || '2026-09-07'
  const refIsSmall = !!config.refIsSmall
  const holidays = new Set(config.holidays || [])
  const makeupWorkdays = new Set(config.makeupWorkdays || [])
  const overrides = config.overrides || {} // { 'YYYY-MM-DD': 'work' | 'rest' }

  const ref = parseLocalDate(refMonday)

  function weekInfo(date) {
    const day = parseLocalDate(date)
    const monday = startOfWeek(day)
    const weeks = Math.floor(diffInDays(monday, ref) / 7)
    let isSmall
    if (mode === 'alternating') {
      isSmall = refIsSmall ? weeks % 2 === 0 : weeks % 2 === 1
    } else if (mode === 'single') {
      isSmall = true
    } else {
      isSmall = false
    }
    return { monday, weeks, isSmall }
  }

  function baseRestDays(date) {
    const day = parseLocalDate(date)
    const dow = day.getDay()
    const info = weekInfo(date)

    if (mode === 'single') {
      return dow === 0 // 只有周日休
    }
    if (mode === 'alternating') {
      if (dow === 0) return true // 周日永远休
      if (dow === 6) return !info.isSmall // 小周周六上班，大周周六休
      return false
    }
    // double
    return dow === 0 || dow === 6
  }

  function statusOf(date) {
    const key = normalizeKey(date)
    if (overrides[key] === 'work') return 'work'
    if (overrides[key] === 'rest') return 'rest'
    if (makeupWorkdays.has(key)) return 'work' // 调休补班：上班
    if (holidays.has(key)) return 'holiday'    // 法定假日：休息
    return baseRestDays(date) ? 'rest' : 'work'
  }

  function infoOf(date) {
    const key = normalizeKey(date)
    const status = statusOf(date)
    const day = parseLocalDate(date)
    const dow = day.getDay()
    const isWeekend = dow === 0 || dow === 6
    const week = weekInfo(date)

    let label = '上班'
    let kind = 'work'
    if (status === 'holiday') {
      label = '放假'
      kind = 'holiday'
    } else if (status === 'rest') {
      label = '休息'
      kind = 'rest'
    } else if (makeupWorkdays.has(key) && !(overrides[key] === 'rest')) {
      label = '补班'
      kind = 'makeup'
    } else if (isWeekend) {
      label = mode === 'alternating' && dow === 6 && week.isSmall ? '周六上班' : '上班'
      kind = 'weekendWork'
    }

    return {
      date: key,
      day,
      dow,
      status,
      kind,
      label,
      isWeekend,
      isSmallWeek: week.isSmall
    }
  }

  return {
    statusOf,
    infoOf,
    weekInfo,
    mode
  }
}

// 常用日期工具（local 时区安全）
export function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function normalizeKey(date) {
  if (typeof date === 'string') return date
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfSunday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const shift = (d.getDay() + 6) % 7 // 周一为一周起点
  d.setDate(d.getDate() - shift)
  return d
}

export function diffInDays(a, b) {
  const ms = new Date(a.getFullYear(), a.getMonth(), a.getDate()) -
    new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round(ms / 86400000)
}

export function todayKey() {
  return normalizeKey(new Date())
}

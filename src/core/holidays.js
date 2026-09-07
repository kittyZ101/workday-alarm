// 国务院办公厅公布的法定节假日调休数据。
// 维护指南：
//   1) 新增年份：在 HOLIDAY_YEARS 加一条，`published: true` 并填好 holidays / workdays。
//   2) 尚未公布的年份：`published: false`、空数组占位，界面会显示「待公布」。
//   3) 每次改数据后把 DATA_VERSION 加 1（在线更新据此判断新旧，防止旧数据覆盖新数据）。

export const DATA_VERSION = 3

export const HOLIDAYS_2026 = {
  name: '2026年法定节假日调休（国务院办公厅）',
  // 法定放假日期（不区分周末，用于覆盖“本来要上班但放假”的日子）
  holidays: [
    // 元旦
    '2026-01-01',
    // 春节
    '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18',
    '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
    // 清明节
    '2026-04-04', '2026-04-05', '2026-04-06',
    // 劳动节
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
    // 端午节
    '2026-06-19', '2026-06-20', '2026-06-21',
    // 中秋节
    '2026-09-25', '2026-09-26', '2026-09-27',
    // 国庆节
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
    '2026-10-05', '2026-10-06', '2026-10-07'
  ],
  // 调休补班日期（本来休息，但因为调休要上班）
  workdays: [
    '2026-01-31',
    '2026-02-14', '2026-02-28',
    '2026-04-26',
    '2026-05-09',
    '2026-09-20',
    '2026-10-10'
  ]
}

export const HOLIDAY_YEARS = {
  2026: {
    name: HOLIDAYS_2026.name,
    published: true,
    holidays: HOLIDAYS_2026.holidays,
    workdays: HOLIDAYS_2026.workdays
  },
  2027: {
    name: '2027年法定节假日调休（待公布）',
    published: false,
    holidays: [],
    workdays: []
  },
  2028: {
    name: '2028年法定节假日调休（待公布）',
    published: false,
    holidays: [],
    workdays: []
  }
}

export function getOfficial(year) {
  return HOLIDAY_YEARS[year] || {
    name: `${year}年（暂无数据）`,
    published: false,
    holidays: [],
    workdays: []
  }
}

export function allYears() {
  return Object.keys(HOLIDAY_YEARS).map(Number).sort((a, b) => a - b)
}

export function publishedYears() {
  return allYears().filter((y) => HOLIDAY_YEARS[y] && HOLIDAY_YEARS[y].published)
}

export function pendingYears() {
  return allYears().filter((y) => !(HOLIDAY_YEARS[y] && HOLIDAY_YEARS[y].published))
}

export function latestPublishedYear() {
  const years = publishedYears()
  return years.length ? Math.max(...years) : new Date().getFullYear()
}

// 把所有「已公布」年份的放假/补班日期合并成一份平铺列表。
export function allOfficialDates() {
  const holidays = new Set()
  const workdays = new Set()
  for (const y of publishedYears()) {
    const d = HOLIDAY_YEARS[y]
    for (const key of d.holidays || []) holidays.add(key)
    for (const key of d.workdays || []) workdays.add(key)
  }
  return { holidays: [...holidays], workdays: [...workdays] }
}

// 用远程数据覆盖内置数据：仅接受同版本或更新版本，避免旧数据回退。
export function applyRemoteData(payload) {
  if (!payload || typeof payload !== 'object') return false
  const version = Number(payload.version)
  if (!Number.isFinite(version) || version < DATA_VERSION) return false
  const years = payload.years
  if (!years || typeof years !== 'object') return false

  let changed = false
  for (const [key, raw] of Object.entries(years)) {
    const y = Number(key)
    if (!Number.isInteger(y) || !raw || typeof raw !== 'object') continue
    const holidays = Array.isArray(raw.holidays) ? raw.holidays : []
    const workdays = Array.isArray(raw.workdays) ? raw.workdays : []
    const published = raw.published === true || holidays.length > 0 || workdays.length > 0
    HOLIDAY_YEARS[y] = {
      name: raw.name || `${y}年法定节假日调休`,
      published,
      holidays,
      workdays
    }
    changed = true
  }
  return changed
}

// 从 src/core/holidays.js 生成 public/holidays.json，作为在线更新数据源。
import { writeFileSync } from 'node:fs'
import { DATA_VERSION, HOLIDAY_YEARS } from '../src/core/holidays.js'

const payload = { version: DATA_VERSION, years: HOLIDAY_YEARS }
const file = new URL('../public/holidays.json', import.meta.url)
writeFileSync(file, JSON.stringify(payload, null, 2) + '\n')
console.log('holidays.json synced (version ' + DATA_VERSION + ')')

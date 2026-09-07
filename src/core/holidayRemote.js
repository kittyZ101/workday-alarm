// 在线更新官方节假日数据：启动时拉取同源 /holidays.json，成功则覆盖内置数据。
// 拉取失败或版本过旧时自动回退到内置基线，不影响使用。
import { applyRemoteData } from './holidays.js'

export async function fetchLatestHolidays(url = '/holidays.json') {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    return applyRemoteData(data)
  } catch {
    return false
  }
}

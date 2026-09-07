import { normalizeKey } from './schedule.js'

function escapeText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

export function genIcs(schedule, startDate, endDate, options = {}) {
  const { name = '上班脑工作日历' } = options
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WorkdayAlarm//CN',
    `X-WR-CALNAME:${escapeText(name)}`,
    'X-WR-TIMEZONE:Asia/Shanghai'
  ]

  const a = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const b = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const key = normalizeKey(d)
    const info = schedule.infoOf(key)
    let summary
    if (info.status === 'holiday') summary = '放假'
    else if (info.kind === 'makeup') summary = '补班'
    else if (info.status === 'rest') summary = '休息'
    else if (info.kind === 'weekendWork') summary = '周六上班'
    else summary = '上班'

    const y = String(d.getFullYear()).padStart(4, '0')
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStamp = `${y}${m}${day}`
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const ny = String(next.getFullYear()).padStart(4, '0')
    const nm = String(next.getMonth() + 1).padStart(2, '0')
    const nd = String(next.getDate()).padStart(2, '0')

    lines.push(
      'BEGIN:VEVENT',
      `UID:workday-${dateStamp}@local`,
      `DTSTAMP:${dateStamp}T000000Z`,
      `DTSTART;VALUE=DATE:${dateStamp}`,
      `DTEND;VALUE=DATE:${ny}${nm}${nd}`,
      `SUMMARY:${escapeText(summary)}`,
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

export async function downloadText(filename, text, mime = 'text/calendar') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const file = new File([blob], filename, { type: mime })

  // 手机端优先用系统分享/保存文件，比直接下载更稳定
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '上班脑工作日历' })
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return 'aborted'
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 1500)
  return 'downloaded'
}

export function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent)
}

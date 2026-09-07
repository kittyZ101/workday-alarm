<script setup>
import { computed, ref } from 'vue'
import { store } from '../store.js'
import { todayKey, startOfWeek, startOfSunday, parseLocalDate, normalizeKey } from '../core/schedule.js'
import { genIcs, downloadText, isWeChat } from '../core/ics.js'
import { getOfficial } from '../core/holidays.js'
import SharePanel from './SharePanel.vue'

const schedule = computed(() => store.schedule)
const wechat = isWeChat()
const downloadStatus = ref('')
const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const cells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const monday = startOfSunday(first)
  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = normalizeKey(d)
    const info = schedule.value.infoOf(key)
    days.push({
      key,
      d,
      day: d.getDate(),
      inMonth: d.getMonth() === month.value - 1,
      info
    })
  }
  return days
})

const summary = computed(() => {
  let work = 0
  let rest = 0
  let holiday = 0
  let makeup = 0
  const first = new Date(year.value, month.value - 1, 1)
  const last = new Date(year.value, month.value, 0)
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const key = normalizeKey(d)
    const info = schedule.value.infoOf(key)
    if (info.kind === 'makeup') makeup++
    if (info.status === 'holiday') holiday++
    if (info.status === 'rest' && info.kind !== 'holiday') rest++
    if (info.status === 'work') work++
  }
  return { work, rest, holiday, makeup }
})

const weekDays = computed(() => {
  const now = parseLocalDate(todayKey())
  const monday = startOfWeek(now)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = normalizeKey(d)
    return { key, d, info: schedule.value.infoOf(key) }
  })
})

const currentYearOfficial = computed(() => getOfficial(year.value))

const alarmSuggestion = computed(() => {
  const now = parseLocalDate(todayKey())
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const info = schedule.value.infoOf(normalizeKey(tomorrow))
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][tomorrow.getDay()]
  const dateText = `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日 周${weekday}`

  if (info.status === 'holiday') {
    return { text: `${dateText}放假，明天闹钟不用响。`, tone: 'good' }
  }
  if (info.status === 'rest') {
    return { text: `${dateText}休息，明天闹钟不用响。`, tone: 'good' }
  }
  if (info.kind === 'makeup') {
    return { text: `${dateText}是调休补班，明天要上班，闹钟要响。`, tone: 'bad' }
  }
  if (info.kind === 'weekendWork') {
    return { text: `${dateText}是大小周上班周六，明天要上班，闹钟要响。`, tone: 'bad' }
  }
  return { text: `${dateText}是正常工作日，明天闹钟照常。`, tone: 'work' }
})

function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value-- } else { month.value-- }
}
function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++ } else { month.value++ }
}

async function exportIcs() {
  downloadStatus.value = ''
  const start = new Date(year.value, 0, 1)
  const end = new Date(year.value, 11, 31)
  const content = genIcs(schedule.value, start, end, { name: '上班脑工作日历' })
  const result = await downloadText('workday-calendar.ics', content)
  if (result === 'shared') downloadStatus.value = '已打开系统分享，请选择“存储到文件”。'
  else if (result === 'downloaded') downloadStatus.value = '已开始下载，请在浏览器下载记录中查看。'
}

function cellClass(info) {
  if (info.status === 'holiday') return 'holiday'
  if (info.kind === 'makeup') return 'makeup'
  if (info.kind === 'weekendWork') return 'weekend-work'
  if (info.status === 'rest') return 'rest'
  return 'work'
}
</script>

<template>
  <section class="view calendar-view">
    <div v-if="store.prevOwnConfig || store.isViewingShared" class="share-banner">
      <div class="share-banner-title">{{ store.isViewingShared ? '你正在查看一份分享的排班' : '已保存为我的排班' }}</div>
      <p class="share-banner-text">在这里改动只影响你自己，不会改到对方的订阅。</p>
      <div class="share-banner-actions">
        <button v-if="store.isViewingShared" class="mini-btn" @click="store.adoptShared()">存为我的排班</button>
        <button v-if="store.prevOwnConfig" class="mini-btn" @click="store.restoreOwn()">恢复我的排班</button>
      </div>
    </div>

    <div class="hero-card">
      <div class="hero-title">这一周，你哪天要上班？</div>
      <p class="hero-text">
        大小周 + 法定调休，自动算给你看。闹钟别再靠猜。
      </p>
    </div>

    <div class="card month-card">
      <div class="month-nav">
        <button class="nav-btn" @click="prevMonth">‹</button>
        <div class="month-title">{{ year }}年{{ monthNames[month - 1] }}</div>
        <button class="nav-btn" @click="nextMonth">›</button>
      </div>

      <p v-if="!currentYearOfficial.published" class="hint small" style="margin: 6px 0 10px;">
        该年度官方调休尚未公布，先按你的排班规则显示；公布后自动更新。
      </p>

      <div class="week-head">
        <span v-for="w in weekLabels" :key="w" :class="{ sun: w === '日' }">{{ w }}</span>
      </div>
      <div class="month-grid">
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="day-cell"
          :class="[cellClass(cell.info), { dim: !cell.inMonth, today: cell.key === todayKey() }]"
        >
          <span class="day-num">{{ cell.day }}</span>
          <span v-if="cell.inMonth" class="day-dot">{{ cell.info.label }}</span>
        </div>
      </div>

      <div class="legend">
        <span><i class="dot rest"></i>休息</span>
        <span><i class="dot holiday"></i>法定假</span>
        <span><i class="dot makeup"></i>补班</span>
        <span><i class="dot weekend-work"></i>周六上班</span>
      </div>
    </div>

    <div class="card summary-card">
      <div class="summary-title">{{ month }}月共上班</div>
      <div class="summary-number">{{ summary.work }}<small> 天</small></div>
      <div class="summary-row">
        <span>休息 {{ summary.rest }} 天</span>
        <span>法定假 {{ summary.holiday }} 天</span>
        <span>补班 {{ summary.makeup }} 天</span>
      </div>
    </div>

    <div class="card week-card">
      <div class="card-title">本周</div>
      <div class="week-row">
        <div
          v-for="w in weekDays"
          :key="w.key"
          class="week-day"
          :class="[cellClass(w.info), { today: w.key === todayKey() }]"
        >
          <span class="week-dow">周{{ ['日', '一', '二', '三', '四', '五', '六'][w.d.getDay()] }}</span>
          <span class="week-num">{{ w.d.getDate() }}</span>
          <span class="week-label">{{ w.info.label }}</span>
        </div>
      </div>
    </div>

    <div class="card alarm-card" :class="alarmSuggestion.tone">
      <div class="alarm-label">明天闹钟</div>
      <div class="alarm-text">{{ alarmSuggestion.text }}</div>
      <p class="alarm-note">完整自动开/关闹钟配置，请看底部「闹钟」页。</p>
    </div>

    <div v-if="wechat" class="wechat-tip">微信内可能无法下载文件，请点右上角「…」→ 在浏览器打开。</div>
    <button class="primary-btn" @click="exportIcs">下载 {{ year }} 年工作日历 .ics</button>
    <p v-if="downloadStatus" class="ok-text center">{{ downloadStatus }}</p>

    <SharePanel />
    <p class="foot-note">导入 iPhone「日历」后，即可配合快捷指令自动判断周末闹钟。</p>
  </section>
</template>

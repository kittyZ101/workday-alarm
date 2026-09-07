<script setup>
import { computed, ref } from 'vue'
import { store } from '../store.js'
import { MODES, parseLocalDate, normalizeKey, todayKey } from '../core/schedule.js'
import { allOfficialDates, publishedYears, pendingYears } from '../core/holidays.js'

const schedule = computed(() => store.schedule)
const newHoliday = ref('')
const newWorkday = ref('')

const official = allOfficialDates()
const publishedYearList = publishedYears()
const pendingYearList = pendingYears()

const customHolidays = computed(() => {
  const officialSet = new Set(official.holidays)
  return store.config.holidays.filter((key) => !officialSet.has(key))
})

const customWorkdays = computed(() => {
  const officialSet = new Set(official.workdays)
  return store.config.makeupWorkdays.filter((key) => !officialSet.has(key))
})

const upcomingSaturdays = computed(() => {
  const today = parseLocalDate(todayKey())
  const list = []
  const d = new Date(today)
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
  for (let i = 0; i < 6; i++) {
    const key = normalizeKey(d)
    list.push({ key, d: new Date(d), info: schedule.value.infoOf(key) })
    d.setDate(d.getDate() + 7)
  }
  return list
})

function addHoliday() {
  if (!newHoliday.value) return
  const key = normalizeKey(newHoliday.value)
  const holidays = store.config.holidays.includes(key)
    ? store.config.holidays
    : [...store.config.holidays, key]
  const makeupWorkdays = store.config.makeupWorkdays.filter((d) => d !== key)
  store.update({ holidays, makeupWorkdays })
  newHoliday.value = ''
}

function addWorkday() {
  if (!newWorkday.value) return
  const key = normalizeKey(newWorkday.value)
  const makeupWorkdays = store.config.makeupWorkdays.includes(key)
    ? store.config.makeupWorkdays
    : [...store.config.makeupWorkdays, key]
  const holidays = store.config.holidays.filter((d) => d !== key)
  store.update({ makeupWorkdays, holidays })
  newWorkday.value = ''
}

function removeHoliday(key) {
  store.update({ holidays: store.config.holidays.filter((x) => x !== key) })
}

function removeWorkday(key) {
  store.update({ makeupWorkdays: store.config.makeupWorkdays.filter((x) => x !== key) })
}
</script>

<template>
  <section class="view config-view">
    <div class="card">
      <div class="card-title">你的排班规则</div>
      <div class="mode-list">
        <button
          v-for="m in MODES"
          :key="m.key"
          class="mode-card"
          :class="{ selected: store.config.mode === m.key }"
          @click="store.update({ mode: m.key })"
        >
          <div class="mode-name">{{ m.label }}</div>
          <div class="mode-desc">{{ m.desc }}</div>
        </button>
      </div>
    </div>

    <div v-if="store.config.mode === 'alternating'" class="card">
      <div class="card-title">大小周基准</div>
      <p class="hint">选一个你确定大小的周一，系统从那一周开始交替推算。</p>
      <label class="field">
        <span>基准周一</span>
        <input
          type="date"
          :value="store.config.refMonday"
          @change="store.update({ refMonday: $event.target.value })"
        />
      </label>
      <label class="toggle-row">
        <span>这个基准周是「小周」</span>
        <input
          type="checkbox"
          :checked="store.config.refIsSmall"
          @change="store.update({ refIsSmall: $event.target.checked })"
        />
        <span class="toggle-desc">小周 = 周六上班，大周 = 周六休息</span>
      </label>
    </div>

    <div class="card">
      <div class="card-title">接下来几个周六</div>
      <div class="sat-list">
        <div
          v-for="s in upcomingSaturdays"
          :key="s.key"
          class="sat-row"
          :class="{ work: s.info.status === 'work', rest: s.info.status !== 'work' }"
        >
          <span class="sat-date">{{ s.key }}</span>
          <span class="sat-label">{{ s.info.label }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">手动纠正</div>
      <p class="hint">公司放假跟官方不一样时，在这里加减。纠正优先于内置规则。</p>

      <label class="field">
        <span>加一个放假日期</span>
        <input type="date" v-model="newHoliday" @change="addHoliday" />
      </label>
      <p class="hint small">内置官方假期 {{ official.holidays.length }} 天；下面只显示你额外添加的放假日期。</p>
      <div v-if="customHolidays.length" class="chip-list">
        <span v-for="key in customHolidays" :key="key" class="chip holiday-chip">
          {{ key }} 放
          <button @click="removeHoliday(key)">×</button>
        </span>
      </div>

      <label class="field">
        <span>加一个补班日期</span>
        <input type="date" v-model="newWorkday" @change="addWorkday" />
      </label>
      <p class="hint small">内置官方补班 {{ official.workdays.length }} 天；下面只显示你额外添加的补班日期。</p>
      <div v-if="customWorkdays.length" class="chip-list">
        <span v-for="key in customWorkdays" :key="key" class="chip workday-chip">
          {{ key }} 班
          <button @click="removeWorkday(key)">×</button>
        </span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">官方节假日数据</div>
      <p class="hint">已收录年份：{{ publishedYearList.join('、') }}；待公布年份：{{ pendingYearList.join('、') }}。</p>
      <p class="hint small">每年国务院办公厅公布后会自动更新；发现与通知不一致时，先在上方「手动纠正」里调整。</p>
    </div>

    <button class="ghost-btn" @click="store.reset()">恢复默认配置</button>
  </section>
</template>

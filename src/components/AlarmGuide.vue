<script setup>
import { computed, ref } from 'vue'
import { store } from '../store.js'
import { genIcs, downloadText, isWeChat } from '../core/ics.js'
import { encodeConfig } from '../core/shareCode.js'

const schedule = computed(() => store.schedule)
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
const isAndroid = /Android/i.test(navigator.userAgent)
const wechat = isWeChat()
const downloadStatus = ref('')
const shortcutUrl = new URL('shortcut.shortcut', location.href).href

function fullUrl(path) {
  const base = location.origin + location.pathname.replace(/\/$/, '')
  return path.startsWith('#') ? `${base}/${path}` : `${base}${path}`
}

// 闹钟专用日历：只包含上班日，日历名固定为「上班脑闹钟」
const alarmIcsUrl = computed(() => fullUrl('/ics?d=' + encodeURIComponent(encodeConfig(store.config)) + '&alarm=1'))
const alarmWebcalUrl = computed(() => alarmIcsUrl.value.replace(/^https:/, 'webcal:'))
const alarmGoogleUrl = computed(() => 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(alarmWebcalUrl.value))

async function exportIcs() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 2, 11, 31)
  const content = genIcs(schedule.value, start, end, { name: '上班脑闹钟', onlyWork: true })
  const result = await downloadText('workday-alarm.ics', content)
  if (result === 'shared') downloadStatus.value = '已打开系统分享，请选择“存储到文件”。'
  else if (result === 'downloaded') downloadStatus.value = '已开始下载，请在浏览器下载记录中查看。'
}
</script>

<template>
  <section class="view guide-view">
    <div class="hero-card">
      <div class="hero-title">让闹钟懂你的排班</div>
      <p class="hero-text">设一次，以后系统按日历自动判断：今天到底响不响。</p>
    </div>

    <div v-if="isIOS" class="card">
      <div class="step-tag">iPhone / iOS</div>
      <div class="card-title">四步配好，以后每天自动响</div>

      <ol class="steps">
        <li>
          <b>添加闹钟专用日历</b>
          <p>点下面按钮订阅；订阅成功后，日历名字会自动是「上班脑闹钟」。</p>
          <div class="platform-actions">
            <a class="ghost-btn link-btn" :href="alarmWebcalUrl">一键添加闹钟日历</a>
            <button class="ghost-btn" @click="exportIcs">没成功？下载 .ics 手动导入</button>
          </div>
        </li>
        <li>
          <b>导入快捷指令</b>
          <p>点下面按钮下载；完成后到「文件」App → 下载，点开下载的快捷指令文件 → 允许 → 添加快捷指令，名字是「大小周闹钟」。</p>
          <div class="platform-actions">
            <a class="primary-btn link-btn" :href="shortcutUrl" download="大小周闹钟.shortcut">一键下载快捷指令</a>
          </div>
        </li>
        <li>
          <b>建一条「上班日」闹钟</b>
          <p>时钟 App → 闹钟 → 新增：时间设为你平时起床点，重复选「每天」，标签必须填「上班日」。</p>
        </li>
        <li>
          <b>建一条每天早上的自动化</b>
          <p>快捷指令 → 自动化 → 每天（建议比闹钟早 30 分钟）→ 添加操作「运行快捷指令」→ 选「大小周闹钟」→ 关闭「运行前询问」。</p>
        </li>
      </ol>

      <div class="card-title">装完自检</div>
      <ul class="tips">
        <li>日历里能看到「上班脑闹钟」这个名字。</li>
        <li>月历里能看到「补班」的日子（说明周日补班也进来了）。</li>
        <li>快捷指令里有「大小周闹钟」。</li>
        <li>闹钟里有标签为「上班日」、每天重复的一条闹钟。</li>
        <li>自动化每天运行，且「运行前询问」已关闭。</li>
      </ul>

      <div v-if="wechat" class="wechat-tip">微信内可能无法下载文件，请点右上角「…」→ 在浏览器打开。</div>
      <p v-if="downloadStatus" class="ok-text center">{{ downloadStatus }}</p>
    </div>

    <div v-else class="card">
      <div class="step-tag">{{ isAndroid ? '安卓 Android' : '电脑' }}</div>
      <div class="card-title">自动闹钟当前仅支持 iPhone</div>
      <ol class="steps">
        <li><b>先看日历</b>：把本站加到主屏幕，每天打开就能看到今天上不上班。</li>
        <li><b>手动闹钟</b>：按日历结果，手动开 / 关闹钟。</li>
        <li><b>安卓正式版</b>：后续会做成系统原生闹钟。</li>
      </ol>
      <div class="platform-actions">
        <a class="ghost-btn link-btn" :href="alarmGoogleUrl" target="_blank" rel="noopener">添加到 Google 日历</a>
      </div>
    </div>

    <div class="card">
      <div class="card-title">添加到主屏幕</div>
      <p class="hint">iPhone Safari：分享 → 添加到主屏幕；安卓 Chrome：菜单 → 安装应用。加完以后就像 App 一样打开。</p>
    </div>

    <div class="card">
      <div class="card-title">小提示</div>
      <ul class="tips">
        <li>自动化建议设成每天 6:30，闹钟设 7:00 或 8:00，判断永远先于铃声。</li>
        <li>法定调休变化后，只需更新日历；快捷指令和闹钟不用重做。</li>
        <li>休息日想睡懒觉不用管：「上班日」闹钟会自动不响。</li>
      </ul>
    </div>
  </section>
</template>

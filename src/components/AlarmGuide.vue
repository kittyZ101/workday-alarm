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
const shortcutUrl = new URL('大小周闹钟.shortcut', location.href).href

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
      <div class="card-title">三步配好</div>

      <div class="one-tap-box">
        <a class="primary-btn link-btn" :href="shortcutUrl" download="大小周闹钟.shortcut">第 0 步：一键导入快捷指令</a>
        <p class="hint small">下载后点文件 → 允许 → 添加快捷指令，名字是「大小周闹钟」。</p>
      </div>

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
          <b>建一个「周六上班」闹钟</b>
          <p>时钟 App → 闹钟 → 新增：时间设为你平时起床点，重复选「周六」，标签必须填「周六上班」。</p>
        </li>
        <li>
          <b>只建一条自动化</b>
          <p>快捷指令 → 自动化 → 每周六早上（建议比闹钟早 30 分钟）→ 添加操作「运行快捷指令」→ 选「大小周闹钟」→ 关闭「运行前询问」。</p>
        </li>
      </ol>
      <div v-if="wechat" class="wechat-tip">微信内可能无法下载文件，请点右上角「…」→ 在浏览器打开。</div>
      <p v-if="downloadStatus" class="ok-text center">{{ downloadStatus }}</p>
    </div>

    <div v-else class="card">
      <div class="step-tag">{{ isAndroid ? '安卓 Android' : '电脑' }}</div>
      <div class="card-title">自动闹钟当前仅支持 iPhone</div>
      <ol class="steps">
        <li><b>先看日历</b>：把本站加到主屏幕，每天打开就能看到今天上不上班。</li>
        <li><b>手动闹钟</b>：按日历结果，手动开 / 关周六闹钟。</li>
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
        <li>自动化建议设成周六 6:30，闹钟设 7:00 或 8:00，判断永远先于铃声。</li>
        <li>法定调休变化后，只需更新日历；快捷指令不用重做。</li>
        <li>周一至周五正常响，用普通「周一至周五」重复闹钟即可。</li>
      </ul>
    </div>
  </section>
</template>

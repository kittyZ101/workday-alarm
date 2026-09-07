<script setup>
import { computed, ref } from 'vue'
import { store } from '../store.js'
import { genIcs, downloadText, isWeChat } from '../core/ics.js'

const schedule = computed(() => store.schedule)
const shortcutUrl = new URL('大小周闹钟.shortcut', location.href).href
const wechat = isWeChat()
const downloadStatus = ref('')

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

    <div class="card">
      <div class="step-tag">iPhone / iOS</div>
      <div class="card-title">三步配置</div>
      <div class="one-tap-box">
        <a class="primary-btn link-btn" :href="shortcutUrl" download="大小周闹钟.shortcut">一键导入快捷指令</a>
        <p class="hint small">下载后点文件 → 允许 → 添加快捷指令，名字是「大小周闹钟」。</p>
      </div>
      <ol class="steps">
        <li>
          <b>导入闹钟专用日历</b>
          <p>点下面「下载闹钟专用 .ics」并导入，新建一个叫「上班脑闹钟」的日历。</p>
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
      <button class="primary-btn" @click="exportIcs">下载闹钟专用 .ics</button>
      <p v-if="downloadStatus" class="ok-text center">{{ downloadStatus }}</p>
    </div>

    <div class="card">
      <div class="step-tag">安卓 Android</div>
      <div class="card-title">第一版先这么用</div>
      <ol class="steps">
        <li><b>看日历</b>：把本站加到主屏幕，每天打开就能看到今天上不上班。</li>
        <li><b>导入 .ics</b>：下载文件后，用系统日历或第三方日历打开导入。</li>
        <li><b>自动闹钟</b>：正式 App 版会做成系统原生闹钟；当前原型请先按日历手动开/关周六闹钟。</li>
      </ol>
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

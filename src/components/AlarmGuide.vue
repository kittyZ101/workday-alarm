<script setup>
import { computed, ref } from 'vue'
import { store } from '../store.js'
import { genIcs, downloadText, isWeChat } from '../core/ics.js'

const schedule = computed(() => store.schedule)
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
      <ol class="steps">
        <li>
          <b>导入闹钟专用日历</b>
          <p>点下面下载并导入，新建一个叫「上班脑闹钟」的日历。它只标记要上班的日子，用来判断周六闹钟。</p>
        </li>
        <li>
          <b>建一个「周末上班」闹钟</b>
          <p>时钟 App → 闹钟 → 新增：时间设为你平时起床点，重复选「周六」，标签填「周六上班」。</p>
        </li>
        <li>
          <b>做一条自动化</b>
          <p>快捷指令 → 自动化 → 每周六早上（建议比闹钟早 30 分钟）：查「上班脑闹钟」日历中「开始日期是今天」的日程；如果有，就打开「周六上班」闹钟；否则关闭它。关掉「运行前询问」。</p>
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

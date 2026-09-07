<script setup>
import { ref, computed } from 'vue'
import { store } from '../store.js'
import { encodeConfig } from '../core/shareCode.js'

const staticUrl = ref('')
const showIcs = ref(false)
const copied = ref('')

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
const isAndroid = /Android/i.test(navigator.userAgent)

function fullUrl(path) {
  const base = location.origin + location.pathname.replace(/\/$/, '')
  return path.startsWith('#') ? `${base}/${path}` : `${base}${path}`
}

// 无状态订阅链接：把当前排班直接编码进 URL，服务端当场生成 .ics
const icsUrl = computed(() => fullUrl('/ics?d=' + encodeURIComponent(encodeConfig(store.config))))
const webcalUrl = computed(() => icsUrl.value.replace(/^https:/, 'webcal:'))
const googleCalendarUrl = computed(() => 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(webcalUrl.value))

function makeStaticUrl() {
  staticUrl.value = fullUrl(`#/?c=${encodeConfig(store.config)}`)
}

function generateSubscription() {
  showIcs.value = true
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    el.remove()
  }
  copied.value = label
  setTimeout(() => { copied.value = '' }, 2000)
}
</script>

<template>
  <div class="card share-card">
    <div class="card-title">分享与订阅</div>
    <p class="hint">把你的排班做成链接发给同事；对方打开就能看到同一份日历，并可改成自己独立的一份。</p>

    <button class="primary-btn" @click="makeStaticUrl">
      生成分享链接
    </button>

    <div v-if="staticUrl" class="url-box">
      <div class="url-row">
        <span class="url-label">分享页面</span>
        <input class="url-input" :value="staticUrl" readonly @focus="$event.target.select()" />
        <button class="mini-btn" @click="copy(staticUrl, '已复制分享链接')">复制</button>
      </div>
    </div>

    <div class="share-divider">
      <span>自动同步订阅</span>
    </div>

    <button class="ghost-btn" @click="generateSubscription">
      添加订阅到日历
    </button>

    <div v-if="showIcs" class="url-box">
      <div class="url-row">
        <span class="url-label">日历订阅</span>
        <input class="url-input" :value="icsUrl" readonly @focus="$event.target.select()" />
        <button class="mini-btn" @click="copy(icsUrl, '已复制订阅链接')">复制</button>
      </div>
    </div>

    <div v-if="showIcs" class="subscribe-guide">
      <div class="subscribe-guide-title">添加到日历</div>

      <div class="platform-actions">
        <a v-if="isIOS" class="primary-btn link-btn" :href="webcalUrl">iPhone 一键添加订阅</a>
        <a v-if="!isIOS" class="primary-btn link-btn" :href="googleCalendarUrl" target="_blank" rel="noopener">添加到 Google 日历</a>
      </div>

      <ol class="steps">
        <li v-if="isIOS">
          <b>如果一键添加没反应</b>
          <p>复制上面的链接 → 设置 → 日历 → 账户 → 添加账户 → 其他 → 添加已订阅的日历 → 粘贴。</p>
        </li>
        <li v-if="isAndroid">
          <b>如果上面没自动打开</b>
          <p>复制链接 → Google 日历 → 设置 → 添加日历 → 从网址添加 → 粘贴。</p>
        </li>
        <li v-if="!isIOS && !isAndroid">
          <b>电脑</b>
          <p>复制链接，粘到日历 App 的「订阅日历 / 从 URL 添加」里。</p>
        </li>
      </ol>

      <p class="hint small">改排班后订阅链接会更新，删掉旧订阅、用新链接重新添加即可。</p>
      <p class="hint small">订阅需要部署到 Vercel / 服务器；纯静态托管请下载 .ics 导入。</p>
    </div>

    <p v-if="copied" class="ok-text">{{ copied }}</p>
  </div>
</template>

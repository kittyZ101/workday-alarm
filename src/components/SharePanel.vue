<script setup>
import { ref, computed } from 'vue'
import { store } from '../store.js'
import { encodeConfig } from '../core/shareCode.js'

const staticUrl = ref('')
const showIcs = ref(false)
const copied = ref('')

function fullUrl(path) {
  const base = location.origin + location.pathname.replace(/\/$/, '')
  return path.startsWith('#') ? `${base}/${path}` : `${base}${path}`
}

// 无状态订阅链接：把当前排班直接编码进 URL，服务端当场生成 .ics
const icsUrl = computed(() => fullUrl('/ics?d=' + encodeURIComponent(encodeConfig(store.config))))

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
      生成日历订阅链接
    </button>

    <div v-if="showIcs" class="url-box">
      <div class="url-row">
        <span class="url-label">日历订阅</span>
        <input class="url-input" :value="icsUrl" readonly @focus="$event.target.select()" />
        <button class="mini-btn" @click="copy(icsUrl, '已复制订阅链接')">复制</button>
      </div>
      <p class="hint small">iOS：设置 → 日历 → 账户 → 添加账户 → 其他 → 添加已订阅的日历，粘贴订阅链接。</p>
      <p class="hint small">订阅是无状态的，链接会随你的排班自动更新；改完排班后，删除旧订阅、用它重新订阅即可。</p>
      <p class="hint small">订阅需要部署到 Vercel / 服务器；若当前是纯静态托管（如 GitHub Pages），请改为下载 .ics 导入。</p>
    </div>

    <p v-if="copied" class="ok-text">{{ copied }}</p>
  </div>
</template>

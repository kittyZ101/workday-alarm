<script setup>
import { ref, watch } from 'vue'
import { store } from '../store.js'
import { encodeConfig } from '../core/shareCode.js'

const busy = ref(false)
const serverBusy = ref(false)
const error = ref('')
const staticUrl = ref('')
const icsUrl = ref('')
const serverNote = ref('')
const copied = ref('')

function fullUrl(path) {
  const base = location.origin + location.pathname.replace(/\/$/, '')
  return path.startsWith('#') ? `${base}/${path}` : `${base}${path}`
}

function makeStaticUrl() {
  staticUrl.value = fullUrl(`#/?c=${encodeConfig(store.config)}`)
}

async function createSubscription() {
  serverBusy.value = true
  error.value = ''
  serverNote.value = ''
  try {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store.config)
    })
    if (!res.ok) throw new Error('生成订阅失败')
    const data = await res.json()
    store.loadedCode = data.code
    icsUrl.value = fullUrl(data.icsUrl)
  } catch (e) {
    serverNote.value = '当前是静态部署，无法生成自动订阅链接；请让同事直接下载 .ics。'
  } finally {
    serverBusy.value = false
  }
}

async function updateSubscription() {
  if (!store.loadedCode) return
  serverBusy.value = true
  error.value = ''
  try {
    const res = await fetch(`/api/schedules/${store.loadedCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store.config)
    })
    if (!res.ok) throw new Error('更新订阅失败')
    copied.value = '已更新，订阅端下次同步会自动刷新'
  } catch (e) {
    error.value = e.message || '更新订阅失败'
  } finally {
    serverBusy.value = false
  }
}

watch(() => store.loadedCode, (code) => {
  if (code && !icsUrl.value) {
    icsUrl.value = fullUrl(`/ics/${code}.ics`)
  }
})

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
    <p class="hint">把排班规则做成链接发给同事；对方打开就能看到同一份日历。</p>

    <button class="primary-btn" :disabled="busy" @click="makeStaticUrl">
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
      <span>自动同步订阅（需要后端）</span>
    </div>

    <button class="ghost-btn" :disabled="serverBusy" @click="createSubscription">
      {{ serverBusy ? '生成中…' : '生成日历订阅链接' }}
    </button>

    <div v-if="icsUrl" class="url-box">
      <div class="url-row">
        <span class="url-label">日历订阅</span>
        <input class="url-input" :value="icsUrl" readonly @focus="$event.target.select()" />
        <button class="mini-btn" @click="copy(icsUrl, '已复制订阅链接')">复制</button>
      </div>
      <p class="hint small">iOS：设置 → 日历 → 账户 → 添加账户 → 其他 → 添加已订阅的日历，粘贴订阅链接。</p>
    </div>

    <button v-if="store.loadedCode && icsUrl" class="ghost-btn" :disabled="serverBusy" @click="updateSubscription">
      把当前修改同步到这份订阅
    </button>

    <p v-if="serverNote" class="hint small server-note">{{ serverNote }}</p>
    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="copied" class="ok-text">{{ copied }}</p>
  </div>
</template>

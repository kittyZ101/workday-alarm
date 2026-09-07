import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store.js'
import { decodeConfig } from './core/shareCode.js'
import { fetchLatestHolidays } from './core/holidayRemote.js'
import './style.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

async function bootstrap() {
  // 先在线更新官方节假日数据（失败自动回退内置），再加载分享配置。
  try {
    const changed = await fetchLatestHolidays()
    if (changed) store.refreshOfficial()
  } catch (e) {
    console.warn('节假日在线更新失败，使用内置数据：', e)
  }

  const hash = location.hash || ''
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '')
  const code = params.get('code')
  const packed = params.get('c')
  if (code) {
    try {
      await store.loadShared(code)
    } catch (e) {
      console.warn('无法加载分享配置：', e)
    }
  } else if (packed) {
    try {
      store.loadStatic(decodeConfig(packed))
    } catch (e) {
      console.warn('无法解析静态分享配置：', e)
    }
  }
  createApp(App).mount('#app')
}

bootstrap()

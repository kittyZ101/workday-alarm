import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store.js'
import { decodeConfig } from './core/shareCode.js'
import './style.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

async function bootstrap() {
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
      store.setConfig(decodeConfig(packed))
    } catch (e) {
      console.warn('无法解析静态分享配置：', e)
    }
  }
  createApp(App).mount('#app')
}

bootstrap()

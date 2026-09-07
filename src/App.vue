<script setup>
import { ref } from 'vue'
import HomeView from './views/HomeView.vue'

const tabs = [
  { key: 'calendar', label: '日历', icon: '📅' },
  { key: 'config', label: '排班', icon: '⚙️' },
  { key: 'guide', label: '闹钟', icon: '⏰' }
]
const active = ref('calendar')
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">⏰</span>
        <div>
          <div class="brand-name">上班脑</div>
          <div class="brand-sub">大小周 · 调休 · 智能闹钟</div>
        </div>
      </div>
      <button class="install-hint" @click="active = 'guide'">添加到主屏幕</button>
    </header>

    <main class="content">
      <HomeView :tab="active" />
    </main>

    <nav class="tabbar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: active === tab.key }"
        @click="active = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

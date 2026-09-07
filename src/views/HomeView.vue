<script setup>
import { computed } from 'vue'
import CalendarView from '../components/CalendarView.vue'
import ConfigView from '../components/ConfigView.vue'
import AlarmGuide from '../components/AlarmGuide.vue'

const props = defineProps({
  tab: { type: String, default: 'calendar' }
})

const current = computed(() => {
  if (props.tab === 'config') return ConfigView
  if (props.tab === 'guide') return AlarmGuide
  return CalendarView
})
</script>

<template>
  <component :is="current" />
</template>

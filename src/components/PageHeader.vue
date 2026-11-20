<!-- Big title at the top of every main screen, with an optional subtitle -->
<script setup lang="ts">
import { Bell } from '@lucide/vue'

defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <header class="header">
    <div class="title-row">
      <h1>{{ title }}</h1>
      <button class="icon-btn" aria-label="Notifications">
        <Bell :size="24" :stroke-width="1.75" />
      </button>
    </div>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped>
.header { padding: 12px var(--page-padding) 22px; }
.title-row { display: flex; align-items: center; justify-content: space-between; }
h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.01em; }
.icon-btn { color: var(--color-text); padding: 4px; margin-right: -4px; }
.subtitle { margin-top: 4px; font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
</style>

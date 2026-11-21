<!-- Big title at the top of every main screen, with an optional subtitle. `logo` shows the PantryX logo instead of the title text. -->
<script setup lang="ts">
import NotificationBell from './NotificationBell.vue'
import logoUrl from '../assets/logo/pantryx-logo.svg'
import markUrl from '../assets/logo/pantryx-zeichen.svg'

// logo = full PantryX logo instead of the title; mark = small PantryX symbol in front of the title
const { logo } = defineProps<{ title: string; subtitle?: string; logo?: boolean; mark?: boolean }>()
</script>

<template>
  <header class="header">
    <div class="title-row">
      <h1 v-if="logo" class="logo-title">
        <img :src="logoUrl" :alt="title" class="logo" />
      </h1>
      <h1 v-else class="title">
        <img v-if="mark" :src="markUrl" alt="" class="mark" />
        {{ title }}
      </h1>
      <NotificationBell />
    </div>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped>
.header { padding: 12px var(--page-padding) 22px; }
.title-row { display: flex; align-items: center; justify-content: space-between; }
h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.01em; }
.title { display: flex; align-items: center; gap: 10px; }
.mark { width: 34px; height: 34px; flex-shrink: 0; }
.logo-title { line-height: 0; }
.logo { display: block; height: 38px; width: auto; }
.subtitle { margin-top: 4px; font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
</style>

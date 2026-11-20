<!-- Bottom navigation with the 4 main tabs. RouterLink switches the screen. -->
<script setup lang="ts">
import { House, Refrigerator, ListChecks, Sprout } from '@lucide/vue'

const tabs = [
  { to: '/', label: 'Home', icon: House },
  { to: '/pantry', label: 'Pantry', icon: Refrigerator },
  { to: '/shopping-list', label: 'Shopping list', icon: ListChecks },
  { to: '/impact', label: 'Impact', icon: Sprout },
]
</script>

<template>
  <nav class="tabbar">
    <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab">
      <span class="icon-area">
        <component :is="tab.icon" :size="21" :stroke-width="1.75" />
      </span>
      <span class="label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  padding: 10px 14px calc(8px + env(safe-area-inset-bottom));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: var(--color-text-muted);
}
.icon-area {
  display: grid;
  place-items: center;
  width: 52px;
  height: 30px;
  border-radius: 12px;
}
.label { font-size: 11px; font-weight: 500; }

/* The tab of the screen you are on ("exact" so "/" is not active everywhere) */
.router-link-exact-active { color: var(--color-primary); }
.router-link-exact-active .icon-area { background: var(--color-tile); }
.router-link-exact-active .label { font-weight: 600; }
</style>

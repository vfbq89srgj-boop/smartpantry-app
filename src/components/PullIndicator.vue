<!-- Small area above the content that grows while you pull down (see lib/pullToRefresh.ts) -->
<script setup lang="ts">
defineProps<{ pull: number; refreshing: boolean }>()
</script>

<template>
  <!-- Not rendered at rest, otherwise it adds an extra flex "gap" at the top of the page -->
  <div v-if="pull > 0 || refreshing" class="ptr" :style="{ height: pull + 'px' }" aria-live="polite">
    <span v-if="refreshing">Refreshing…</span>
    <span v-else>Pull down to refresh</span>
  </div>
</template>

<style scoped>
.ptr {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>

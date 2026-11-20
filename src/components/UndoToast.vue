<!--
  Small message above the tab bar, e.g. "Milk marked as eaten – Undo".
  Disappears by itself after a few seconds (step 5: "Undo hint").
-->
<script setup lang="ts">
import { Undo2 } from '@lucide/vue'

defineProps<{ message: string }>()
defineEmits<{ undo: [] }>()
</script>

<template>
  <div class="toast" role="status">
    <span>{{ message }}</span>
    <button class="undo" @click="$emit('undo')">
      <Undo2 :size="16" :stroke-width="2" />
      Undo
    </button>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(96px + env(safe-area-inset-bottom));
  max-width: 488px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-on-primary);
  font-size: 14px;
  box-shadow: 0 6px 20px rgb(24 62 50 / 0.25);
}
.undo {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-accent);
  font-weight: 600;
}
</style>

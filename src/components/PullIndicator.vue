<!--
  Pull-to-refresh indicator (see lib/pullToRefresh.ts).
  A round chip that floats over the page and slides down while you pull. It does NOT push the
  content around (no layout changes), so it stays smooth – iOS bounces the page by itself.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from '@lucide/vue'

const props = defineProps<{ pull: number; refreshing: boolean; dragging?: boolean }>()

const THRESHOLD = 70
const progress = computed(() => Math.min(props.pull / THRESHOLD, 1))
// 48px chip, hidden above the screen edge at rest; follows the finger, rests at the hold position while loading
const y = computed(() => props.pull - 48)
const opacity = computed(() => (props.refreshing ? 1 : Math.min(props.pull / (THRESHOLD * 0.5), 1)))
</script>

<template>
  <div
    class="ptr"
    :class="{ dragging }"
    :style="{ transform: `translate(-50%, ${y}px) scale(${0.6 + progress * 0.4})`, opacity }"
    role="status"
    aria-live="polite"
    :aria-label="refreshing ? 'Refreshing' : 'Pull down to refresh'">
    <RefreshCw
      class="icon"
      :class="{ spin: refreshing, ready: progress >= 1 && !refreshing }"
      :style="refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }"
      :size="20"
      :stroke-width="2" />
  </div>
</template>

<style scoped>
.ptr {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 8px);
  left: 50%;
  z-index: 30;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 4px 14px rgb(30 77 58 / 0.2), 0 0 0 1px var(--color-border);
  pointer-events: none;
  will-change: transform, opacity;
  /* when you let go: glide back (or to the loading position) instead of jumping */
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
}
/* while the finger is on the screen: follow it directly, no delay */
.ptr.dragging { transition: none; }

.icon { transition: transform 0.15s ease-out; }
.ptr.dragging .icon { transition: none; }
.icon.ready { color: var(--color-brand-green); }
.icon.spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .ptr { transition: none; }
  .icon.spin { animation-duration: 2s; }
}
</style>

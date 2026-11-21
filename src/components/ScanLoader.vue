<!--
  Waiting animation for the receipt scan: a paper receipt with a moving scan beam,
  groceries floating up from it, and a small text that changes every few seconds.
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Apple, Carrot, Milk } from '@lucide/vue'

const messages = [
  'Teaching our AI to read tiny receipt fonts…',
  'Counting your tomatoes… twice.',
  'Asking the milk how long it will last…',
  'Sorting the snacks from the veggies…',
]
const index = ref(Math.floor(Math.random() * messages.length)) // not always the same one first
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => (index.value = (index.value + 1) % messages.length), 2800)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="loader" role="status" aria-live="polite">
    <div class="stage" aria-hidden="true">
      <!-- groceries popping out of the receipt -->
      <Apple class="food f1" :size="26" :stroke-width="1.75" />
      <Carrot class="food f2" :size="26" :stroke-width="1.75" />
      <Milk class="food f3" :size="26" :stroke-width="1.75" />

      <div class="receipt">
        <span class="bar b1" />
        <span class="bar b2" />
        <span class="bar b3" />
        <span class="bar b4" />
        <span class="bar b5" />
        <span class="bar b6" />
        <span class="beam" />
      </div>
    </div>

    <p class="title">Reading your photo…</p>
    <!-- key = restart the fade whenever the text changes -->
    <Transition name="swap" mode="out-in">
      <p :key="index" class="sub">{{ messages[index] }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 12px 60px;
  text-align: center;
}
.stage {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 14px;
  display: grid;
  place-items: center;
}

/* Receipt paper */
.receipt {
  position: relative;
  width: 118px;
  height: 156px;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  overflow: hidden;
  border-radius: 10px 10px 4px 4px;
  background: var(--color-surface);
  box-shadow: 0 10px 26px rgb(30 77 58 / 0.18), 0 0 0 1px var(--color-border);
  animation: sway 3.2s ease-in-out infinite;
}
.bar {
  height: 7px;
  border-radius: 4px;
  background: var(--color-tile);
}
.b1 { width: 60%; background: var(--color-accent); }
.b2 { width: 100%; }
.b3 { width: 85%; }
.b4 { width: 100%; }
.b5 { width: 70%; }
.b6 { width: 45%; margin-top: 4px; background: var(--color-accent); }

/* Scan beam */
.beam {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 36px;
  background: linear-gradient(to bottom, transparent, rgb(76 175 110 / 0.35) 80%, var(--color-brand-green));
  border-bottom: 2px solid var(--color-brand-green);
  animation: scan 1.8s ease-in-out infinite;
}

/* Groceries float up and fade out, one after the other */
.food {
  position: absolute;
  bottom: 52px;
  color: var(--color-primary);
  opacity: 0;
  animation: float 3.6s ease-out infinite;
}
.f1 { left: 6px; animation-delay: 0s; }
.f2 { left: 87px; animation-delay: 1.2s; }
.f3 { right: 6px; animation-delay: 2.4s; }

@keyframes scan {
  0% { transform: translateY(-36px); }
  50% { transform: translateY(156px); }
  100% { transform: translateY(-36px); }
}
@keyframes sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
@keyframes float {
  0% { opacity: 0; transform: translateY(20px) scale(0.7); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-70px) scale(1.1) rotate(12deg); }
}

.title {
  font-size: 20px;
  font-weight: 600;
}
.sub {
  min-height: 2.8em; /* two lines, so the layout does not jump when the text changes */
  max-width: 260px;
  font-size: 14px;
  color: var(--color-text-muted);
}
.swap-enter-active, .swap-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); }

@media (prefers-reduced-motion: reduce) {
  .receipt, .beam, .food { animation: none; }
  .beam { top: 60px; }
  .food { opacity: 0.6; }
}
</style>

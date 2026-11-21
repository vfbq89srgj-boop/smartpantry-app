<!--
  Start screen: logo on dark green, shown once per app start (not on every page change).
  Fades out by itself and tells App.vue when it is done.
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import logoWhite from '../assets/logo/pantryx-logo-weiss.svg'

const emit = defineEmits<{ done: [] }>()
const visible = ref(true)

// While the splash is up, paint the page itself green too: if the iPhone leaves a thin strip at the
// top (status bar / Dynamic Island area) uncovered, that strip is then green instead of cream.
const root = document.documentElement
const previousBackground = root.style.background
// Android Chrome / PWA colours the status bar from <meta name="theme-color"> → green during the splash
const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
const previousTheme = themeMeta?.content

onMounted(() => {
  root.style.background = 'var(--color-brand)'
  if (themeMeta) themeMeta.content = '#1e4d3a'
  window.setTimeout(() => (visible.value = false), 1500)
})
onUnmounted(() => {
  root.style.background = previousBackground
  if (themeMeta && previousTheme) themeMeta.content = previousTheme
})
</script>

<template>
  <Transition name="splash" @after-leave="emit('done')">
    <div v-if="visible" class="splash" role="img" aria-label="PantryX">
      <img :src="logoWhite" alt="" class="logo" />
    </div>
  </Transition>
</template>

<style scoped>
.splash {
  position: fixed;
  /* reach into the safe areas (notch / Dynamic Island on top, home bar at the bottom) on purpose */
  top: calc(-1 * env(safe-area-inset-top));
  right: 0;
  bottom: calc(-1 * env(safe-area-inset-bottom));
  left: 0;
  /* always at least the full screen, also when browser bars are shown or hidden (lvh = large viewport) */
  min-height: 100vh;
  min-height: 100lvh;
  z-index: 100;
  display: grid;
  place-items: center;
  background: var(--color-brand); /* same dark green as the logo */
}
.logo {
  width: min(280px, 70vw);
  height: auto;
  animation: pop 0.6s ease-out both;
}
@keyframes pop {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.splash-leave-active { transition: opacity 0.4s ease; }
.splash-leave-to { opacity: 0; }
</style>

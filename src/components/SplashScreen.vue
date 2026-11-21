<!--
  Start screen: logo on dark green, shown once per app start (not on every page change).
  Fades out by itself and tells App.vue when it is done.
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import logoWhite from '../assets/logo/pantryx-logo-weiss.svg'

const emit = defineEmits<{ done: [] }>()
const visible = ref(true)

onMounted(() => {
  window.setTimeout(() => (visible.value = false), 1500)
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
  inset: 0;
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

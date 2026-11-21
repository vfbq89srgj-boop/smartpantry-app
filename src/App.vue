<!-- The app frame: the current screen (RouterView) plus the tab bar at the bottom -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from './components/TabBar.vue'
import SplashScreen from './components/SplashScreen.vue'
import { session } from './data/auth'
import { loadItems } from './data/pantry'
import { loadShoppingList } from './data/shoppingList'

const route = useRoute()
const router = useRouter()

// Logo splash once per app start (a reload in the same tab skips it)
const showSplash = ref(!sessionStorage.getItem('splashShown'))
function splashDone() {
  sessionStorage.setItem('splashShown', '1')
  showSplash.value = false
}

// After login: load the pantry. After logout (or expired session): back to login.
watch(
  () => session.value?.user.id,
  (userId, previous) => {
    if (userId) {
      loadItems()
      loadShoppingList()
    } else if (previous) router.replace('/login')
  },
  { immediate: true },
)
</script>

<template>
  <SplashScreen v-if="showSplash" @done="splashDone" />
  <div class="app" :class="{ 'no-tabs': route.meta.public }">
    <RouterView />
  </div>
  <TabBar v-if="!route.meta.public" />
</template>

<style scoped>
.app {
  max-width: 520px;
  margin: 0 auto;
  /* room for the iPhone status bar on top and the tab bar at the bottom */
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(90px + env(safe-area-inset-bottom));
}
.app.no-tabs { padding-bottom: env(safe-area-inset-bottom); }
</style>

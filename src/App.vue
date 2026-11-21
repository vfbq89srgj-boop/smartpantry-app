<!-- The app frame: the current screen (RouterView) plus the tab bar at the bottom -->
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from './components/TabBar.vue'
import { session } from './data/auth'
import { loadItems } from './data/pantry'
import { loadShoppingList } from './data/shoppingList'

const route = useRoute()
const router = useRouter()

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

<!-- The app frame: the current screen (RouterView) plus the tab bar at the bottom -->
<script setup lang="ts">
import TabBar from './components/TabBar.vue'
</script>

<template>
  <div class="app">
    <RouterView />
  </div>
  <TabBar />
</template>

<style scoped>
.app {
  max-width: 520px;
  margin: 0 auto;
  /* room for the iPhone status bar on top and the tab bar at the bottom */
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(90px + env(safe-area-inset-bottom));
}
</style>

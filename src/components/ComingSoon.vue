<!-- Placeholder for screens we have not built yet -->
<script setup lang="ts">
import PageHeader from './PageHeader.vue'
defineProps<{ title: string; text: string }>()
</script>

<template>
  <PageHeader :title="title" />
  <div class="card placeholder">
    <p>{{ text }}</p>
  </div>
</template>

<style scoped>
.placeholder {
  margin: 0 var(--page-padding);
  padding: 28px 22px;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>

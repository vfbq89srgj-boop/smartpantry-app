<!-- Small coloured label that shows how soon an item expires ("Today", "In 2 days" …) -->
<script setup lang="ts">
import { computed } from 'vue'
import { expiryLabel, freshness } from '../data/pantry'

const props = defineProps<{ date: string | null }>()

const tone = computed(() => freshness(props.date))
const label = computed(() => expiryLabel(props.date))
</script>

<template>
  <span class="badge" :class="tone">{{ label }}</span>
</template>

<style scoped>
.badge {
  flex-shrink: 0;
  padding: 5px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.red { background: var(--fresh-red-bg); color: var(--fresh-red-text); }
.amber { background: var(--fresh-amber-bg); color: var(--fresh-amber-text); }
.green { background: var(--fresh-green-bg); color: var(--fresh-green-text); }
.grey { background: var(--fresh-grey-bg); color: var(--fresh-grey-text); }
</style>

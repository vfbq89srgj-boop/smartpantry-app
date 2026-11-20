<!-- One food item in a list: icon tile, name, "2× · Fridge", expiry badge -->
<script setup lang="ts">
import { computed } from 'vue'
import { storageLabel, type PantryItem } from '../data/pantry'
import { categoryOf } from '../data/categories'
import ExpiryBadge from './ExpiryBadge.vue'

const props = defineProps<{ item: PantryItem }>()

const category = computed(() => categoryOf(props.item.category))
const details = computed(() => {
  const qty = props.item.quantity ? `${props.item.quantity}× · ` : ''
  return qty + storageLabel[props.item.suggestedStoragePlace]
})
</script>

<template>
  <div class="row">
    <div class="icon-tile">
      <component :is="category.icon" :size="22" :stroke-width="1.75" />
    </div>
    <div class="text">
      <p class="name">{{ item.name }}</p>
      <p class="details">{{ details }}</p>
    </div>
    <ExpiryBadge :date="item.expirationDate" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: var(--gap);
  padding: 13px 0;
}
.icon-tile {
  display: grid;
  place-items: center;
  width: 40px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  color: var(--color-primary);
}
.text { flex: 1; min-width: 0; }
.name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.details { margin-top: 2px; font-size: 12px; color: var(--color-text-muted); }
</style>

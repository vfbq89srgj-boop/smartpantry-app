<!--
  One scanned item in the review list (MVP step 1: "Review list – edit, delete, add").
  Everything can be corrected before it is saved.
  Unreadable items are highlighted and must be fixed or removed.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus, Trash } from '@lucide/vue'
import { categories, categoryOf } from '../data/categories'
import { storageLabel, type StoragePlace } from '../data/pantry'
import type { ScannedItem } from '../api/receipts'

const item = defineModel<ScannedItem>({ required: true })
defineEmits<{ remove: [] }>()

const places = Object.keys(storageLabel) as StoragePlace[]
const icon = computed(() => categoryOf(item.value.category).icon)

/** Still needs fixing? (no real name or no storage place) */
const needsFix = computed(
  () => item.value.unreadable && (item.value.name === 'Unreadable item' || !item.value.name.trim() || !item.value.suggestedStoragePlace),
)

function changeQty(step: number) {
  item.value.quantity = Math.max(1, (item.value.quantity ?? 1) + step)
}

// Once the user changes the date by hand it is no longer an AI estimate
function onDateChange() {
  item.value.expirationDateEstimated = false
}
</script>

<template>
  <article class="card review" :class="{ warn: needsFix }">
    <p v-if="needsFix" class="warn-text">We couldn’t read this item – enter the name and storage place, or remove it.</p>

    <div class="top">
      <div class="icon-tile"><component :is="icon" :size="22" :stroke-width="1.75" /></div>
      <input v-model="item.name" class="name" :placeholder="'Item name'" aria-label="Item name" @focus="item.name === 'Unreadable item' && (item.name = '')" />
      <button class="remove" aria-label="Remove item" @click="$emit('remove')">
        <Trash :size="18" :stroke-width="1.75" />
      </button>
    </div>

    <div class="fields">
      <label class="field">
        <span>Quantity</span>
        <div class="stepper">
          <button aria-label="Less" @click="changeQty(-1)"><Minus :size="16" /></button>
          <span>{{ item.quantity ?? 1 }}</span>
          <button aria-label="More" @click="changeQty(1)"><Plus :size="16" /></button>
        </div>
      </label>

      <label class="field">
        <span>Stored in</span>
        <select v-model="item.suggestedStoragePlace">
          <option :value="null" disabled>Choose…</option>
          <option v-for="p in places" :key="p" :value="p">{{ storageLabel[p] }}</option>
        </select>
      </label>

      <label class="field">
        <span>Category</span>
        <select v-model="item.category">
          <option v-for="(info, code) in categories" :key="code" :value="code">{{ info.label }}</option>
        </select>
      </label>

      <label class="field">
        <span>Best before <em v-if="item.expirationDateEstimated">· AI estimate</em></span>
        <input v-model="item.expirationDate" type="date" @change="onDateChange" />
      </label>
    </div>
  </article>
</template>

<style scoped>
.review { padding: 14px; border: 1px solid transparent; }
.review.warn { border-color: var(--fresh-red-text); background: #fffaf9; }
.warn-text { margin-bottom: 10px; font-size: 12px; font-weight: 500; color: var(--fresh-red-text); }

.top { display: flex; align-items: center; gap: 10px; }
.icon-tile {
  display: grid; place-items: center; flex-shrink: 0;
  width: 40px; height: 40px; border-radius: var(--radius-sm);
  background: var(--color-surface-soft); color: var(--color-primary);
}
.name {
  flex: 1; min-width: 0; padding: 8px 10px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font: inherit; font-size: 15px; font-weight: 600; color: var(--color-text);
  background: var(--color-surface);
}
.remove { padding: 8px; color: var(--color-text-muted); }

.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 500; color: var(--color-text-muted); }
.field em { font-style: normal; color: var(--fresh-amber-text); }
select, input[type='date'] {
  height: 36px; padding: 0 8px; width: 100%;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-surface); color: var(--color-text);
  font: inherit; font-size: 14px;
  -webkit-appearance: none; appearance: none;
}
.stepper {
  display: flex; align-items: center; justify-content: space-between; height: 36px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface);
  font-size: 14px; color: var(--color-text);
}
.stepper button { display: grid; place-items: center; width: 36px; height: 100%; color: var(--color-primary); }
</style>

<!--
  Add an item by hand (/pantry/new → POST /api/v1/Items, source "manual")
  or edit a saved item (/pantry/:id/edit → PUT /api/v1/Items/{id}).
  Name, quantity, category, storage place, best-before date, total weight and total price.
  Eaten / thrown-away amounts stay as they are – quantity can't go below them.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Minus, Plus } from '@lucide/vue'
import { categories, categoryOf } from '../data/categories'
import { addItems, pantry, storageLabel, updateItem, usedOf, type StoragePlace } from '../data/pantry'
import { localDateString } from '../lib/date'

const route = useRoute()
const router = useRouter()

const isNew = route.path === '/pantry/new'
const item = computed(() => pantry.items.find((i) => i.id === Number(route.params.id)))
const places: StoragePlace[] = ['Refrigerator', 'Freezer', 'Pantry']

// Local copy of the fields – saved only when the user taps "Save"
const original = isNew ? undefined : item.value
const name = ref(original?.name ?? '')
const quantity = ref(original?.quantity ?? 1)
const category = ref(original?.category ?? 'other')
const place = ref<StoragePlace>(
  original?.suggestedStoragePlace === 'Room Temperature' ? 'Pantry' : (original?.suggestedStoragePlace ?? 'Refrigerator'),
)
const expirationDate = ref(original?.expirationDate ?? '')
const estimated = ref(original?.expirationDateEstimated ?? false)
const weightText = ref(original?.weightKg != null ? String(original.weightKg).replace('.', ',') : '')
const priceText = ref(original?.price != null ? original.price.toFixed(2).replace('.', ',') : '')

const used = computed(() => (original ? usedOf(original) : 0))
const minQuantity = computed(() => Math.max(1, used.value))
const icon = computed(() => categoryOf(category.value).icon)

/** "0,5" → 0.5 · empty → null · invalid → NaN */
function toNumber(value: string): number | null {
  if (!value.trim()) return null
  return Number(value.replace(',', '.'))
}

const errors = computed(() => {
  const list: string[] = []
  if (!name.value.trim()) list.push('Enter a name.')
  const w = toNumber(weightText.value)
  if (w !== null && !(w > 0)) list.push('Weight must be a number above 0.')
  const p = toNumber(priceText.value)
  if (p !== null && !(p >= 0)) list.push('Price must be a number (0 or more).')
  return list
})

const saving = ref(false)
const saveError = ref('')

async function save() {
  if ((!isNew && !original) || errors.value.length) return
  saving.value = true
  saveError.value = ''
  const fields = {
    name: name.value.trim(),
    quantity: quantity.value,
    category: category.value,
    suggestedStoragePlace: place.value,
    expirationDate: expirationDate.value || null,
    expirationDateEstimated: estimated.value,
    weightKg: toNumber(weightText.value),
    price: toNumber(priceText.value),
  }
  const error = isNew
    ? await addItems([fields], localDateString(), 'manual') // no receipt → no fileHash
    : await updateItem(original!.id, fields)
  saving.value = false
  if (error) saveError.value = error
  else router.back()
}

// Changing the date by hand → no longer an AI estimate
function onDateChange() {
  estimated.value = false
}
</script>

<template>
  <header class="bar">
    <button class="back" aria-label="Back" @click="router.back()"><ChevronLeft :size="24" /></button>
    <h1>{{ isNew ? 'Add item' : 'Edit item' }}</h1>
  </header>

  <main v-if="isNew || item" class="page">
    <section class="card form">
      <div class="top">
        <div class="icon-tile"><component :is="icon" :size="22" :stroke-width="1.75" /></div>
        <input v-model="name" class="name" aria-label="Item name" placeholder="e.g. Apples" :autofocus="isNew" />
      </div>

      <div class="fields">
        <label class="field">
          <span>Quantity bought</span>
          <div class="stepper">
            <button aria-label="Less" :disabled="quantity <= minQuantity" @click="quantity = Math.max(minQuantity, quantity - 1)"><Minus :size="16" /></button>
            <span>{{ quantity }}</span>
            <button aria-label="More" @click="quantity++"><Plus :size="16" /></button>
          </div>
        </label>

        <label class="field">
          <span>Stored in</span>
          <select v-model="place">
            <option v-for="p in places" :key="p" :value="p">{{ storageLabel[p] }}</option>
          </select>
        </label>

        <label class="field">
          <span>Category</span>
          <select v-model="category">
            <option v-for="(info, code) in categories" :key="code" :value="code">{{ info.label }}</option>
          </select>
        </label>

        <label class="field">
          <span>Best before <em v-if="estimated">· AI estimate</em></span>
          <input v-model="expirationDate" type="date" @change="onDateChange" />
        </label>

        <label class="field">
          <span>Total weight (kg)</span>
          <input v-model="weightText" type="text" inputmode="decimal" placeholder="e.g. 0,5" />
        </label>

        <label class="field">
          <span>Total price (€)</span>
          <input v-model="priceText" type="text" inputmode="decimal" placeholder="e.g. 2,49" />
        </label>
      </div>

      <p v-if="used" class="hint">
        {{ used }} already eaten or thrown away – so at least {{ used }} must stay as quantity.
        {{ quantity - used }} left at home after saving.
      </p>
    </section>

    <p v-for="e in errors" :key="e" class="error">{{ e }}</p>
    <p v-if="saveError" class="error">{{ saveError }}</p>

    <button class="btn-primary" :disabled="saving || errors.length > 0" @click="save">
      {{ saving ? 'Saving…' : isNew ? 'Add to pantry' : 'Save changes' }}
    </button>
  </main>

  <main v-else class="page"><p class="card hint-card">This item is no longer in your pantry.</p></main>
</template>

<style scoped>
.bar { display: flex; align-items: center; gap: 4px; padding: 12px 16px 16px 12px; }
.bar h1 { font-size: 22px; font-weight: 600; }
.back { display: grid; place-items: center; width: 36px; height: 36px; color: var(--color-text); }
.page { display: flex; flex-direction: column; gap: 12px; padding: 0 var(--page-padding) 16px; }

.form { padding: 16px; }
.top { display: flex; align-items: center; gap: 10px; }
.icon-tile {
  display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px;
  border-radius: var(--radius-sm); background: var(--color-surface-soft); color: var(--color-primary);
}
.name {
  flex: 1; min-width: 0; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font: inherit; font-size: 16px; font-weight: 600; color: var(--color-text); background: var(--color-surface);
}
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 500; color: var(--color-text-muted); }
.field em { font-style: normal; color: var(--fresh-amber-text); }
select, input[type='date'], input[inputmode='decimal'] {
  height: 38px; padding: 0 8px; width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 15px;
  -webkit-appearance: none; appearance: none;
}
.stepper {
  display: flex; align-items: center; justify-content: space-between; height: 38px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface);
  font-size: 15px; color: var(--color-text);
}
.stepper button { display: grid; place-items: center; width: 38px; height: 100%; color: var(--color-primary); }
.stepper button:disabled { opacity: 0.3; }
.hint { margin-top: 12px; font-size: 12px; color: var(--color-text-muted); }
.hint-card { padding: 18px; font-size: 14px; color: var(--color-text-muted); }
.error { font-size: 13px; font-weight: 500; color: var(--fresh-red-text); }
.btn-primary:disabled { opacity: 0.45; }
</style>

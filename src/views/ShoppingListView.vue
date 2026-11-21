<!--
  Shopping list – MVP step 3.
  Add items, tick them off while shopping, remove them.
  Tags show where an entry came from (recipe / pantry).
-->
<script setup lang="ts">
import { ref } from 'vue'
import { Check, Plus, X } from '@lucide/vue'
import PageHeader from '../components/PageHeader.vue'
import { addToList, checkedEntries, clearChecked, openEntries, removeEntry, shoppingList, toggleEntry } from '../data/shoppingList'

const newItem = ref('')
const hint = ref('')

function add() {
  if (!newItem.value.trim()) return
  if (addToList(newItem.value)) {
    newItem.value = ''
    hint.value = ''
  } else {
    hint.value = 'Already on your list.'
  }
}

const sourceLabel = { manual: '', pantry: 'From pantry', recipe: 'For a recipe' }
</script>

<template>
  <PageHeader mark title="Shopping list" :subtitle="`${openEntries.length} to buy`" />

  <main class="page">
    <form class="add" @submit.prevent="add">
      <input v-model="newItem" placeholder="Add an item…" aria-label="New item" enterkeyhint="done" @input="hint = ''" />
      <button type="submit" aria-label="Add"><Plus :size="20" /></button>
    </form>
    <p v-if="hint" class="hint">{{ hint }}</p>
    <p v-if="shoppingList.error" class="hint" role="alert">{{ shoppingList.error }}</p>

    <TransitionGroup v-if="openEntries.length" tag="ul" name="list" class="card entries">
      <li v-for="e in openEntries" :key="e.id">
        <button class="box" :aria-label="`Tick off ${e.name}`" @click="toggleEntry(e.id)" />
        <span class="name">{{ e.name }}</span>
        <span v-if="sourceLabel[e.source]" class="tag">{{ sourceLabel[e.source] }}</span>
        <button class="remove" :aria-label="`Remove ${e.name}`" @click="removeEntry(e.id)"><X :size="16" /></button>
      </li>
    </TransitionGroup>
    <p v-else class="card empty">Your list is empty. Missing recipe ingredients land here too.</p>

    <section v-if="checkedEntries.length">
      <div class="done-head">
        <h2>In the cart</h2>
        <button class="link" @click="clearChecked">Clear</button>
      </div>
      <ul class="card entries done">
        <li v-for="e in checkedEntries" :key="e.id">
          <button class="box checked" :aria-label="`Untick ${e.name}`" @click="toggleEntry(e.id)"><Check :size="14" :stroke-width="3" /></button>
          <span class="name">{{ e.name }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.page { padding: 0 var(--page-padding); }

.add { display: flex; gap: 8px; }
.add input {
  flex: 1; height: 46px; padding: 0 14px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 16px;
}
.add input:focus { outline: 2px solid var(--color-primary); outline-offset: -1px; }
.add button { display: grid; place-items: center; width: 46px; border-radius: var(--radius-md); background: var(--color-primary); color: var(--color-on-primary); }
.hint { margin-top: 6px; font-size: 12px; color: var(--fresh-amber-text); }

.entries { margin: 14px 0 0; padding: 0 14px; list-style: none; }
.entries li { display: flex; align-items: center; gap: 12px; min-height: 52px; }
.entries li + li { border-top: 1px solid var(--color-border); }
.box {
  display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0;
  border: 2px solid var(--color-primary); border-radius: 7px;
}
.box.checked { background: var(--color-primary); color: var(--color-on-primary); }
.name { flex: 1; font-size: 15px; font-weight: 500; }
.tag { padding: 3px 7px; border-radius: var(--radius-xs); background: var(--color-tile); color: var(--color-primary); font-size: 11px; font-weight: 500; white-space: nowrap; }
.remove { padding: 6px; color: var(--color-text-muted); }

.done-head { display: flex; align-items: center; justify-content: space-between; margin: 24px 0 0; }
.done-head h2 { font-size: 16px; font-weight: 600; }
.link { color: var(--color-primary); font-size: 13px; font-weight: 600; }
.done .name { color: var(--color-text-muted); text-decoration: line-through; }
.empty { margin-top: 14px; padding: 22px; font-size: 14px; color: var(--color-text-muted); text-align: center; }

.list-leave-active { transition: all 0.2s ease; }
.list-leave-to { opacity: 0; transform: translateX(30px); }
</style>

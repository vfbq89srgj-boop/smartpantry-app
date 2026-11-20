<!--
  Pantry screen – MVP step 3 (pantry view) and step 5 (eaten / thrown away).
  - All items that are in stock, sorted by expiry (soonest first)
  - Traffic light badge with days left
  - Filter by storage place
  - "Eaten" / "Thrown away" buttons with an Undo hint
  - Empty state that leads to the receipt scan
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Camera, Check, Trash } from '@lucide/vue'
import PageHeader from '../components/PageHeader.vue'
import ItemRow from '../components/ItemRow.vue'
import UndoToast from '../components/UndoToast.vue'
import { pantry, bySoonestExpiry, daysLeft, setStatus, type ItemStatus, type PantryItem, type StoragePlace } from '../data/pantry'

const router = useRouter()

// ----- Filter by storage place -----
const filters: { label: string; value: StoragePlace | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Fridge', value: 'Refrigerator' },
  { label: 'Freezer', value: 'Freezer' },
  { label: 'Pantry', value: 'Pantry' },
  { label: 'Room temp.', value: 'Room Temperature' },
]
const activeFilter = ref<StoragePlace | 'all'>('all')

const visibleItems = computed(() =>
  activeFilter.value === 'all'
    ? bySoonestExpiry.value
    : bySoonestExpiry.value.filter((i) => i.suggestedStoragePlace === activeFilter.value),
)

/** Expired items get highlighted buttons (step 5) */
function isExpired(item: PantryItem) {
  const d = daysLeft(item.expirationDate)
  return d !== null && d < 0
}

// ----- Eaten / thrown away with Undo -----
const toast = ref<{ id: number; message: string } | null>(null)
let toastTimer: number | undefined

function mark(item: PantryItem, status: ItemStatus) {
  setStatus(item.id, status)
  const text = status === 'eaten' ? 'marked as eaten' : 'marked as thrown away'
  toast.value = { id: item.id, message: `${item.name} ${text}` }
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = null), 4000)
}

function undo() {
  if (!toast.value) return
  setStatus(toast.value.id, 'in_stock')
  toast.value = null
}
</script>

<template>
  <PageHeader title="Pantry" :subtitle="`${bySoonestExpiry.length} items · what expires first is on top`" />

  <main class="page">
    <!-- Filter chips (scroll sideways on small phones) -->
    <div class="chips">
      <button
        v-for="f in filters"
        :key="f.value"
        class="chip"
        :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <p v-if="pantry.loading && !pantry.items.length" class="card note">Loading your pantry…</p>
    <p v-else-if="pantry.error" class="card note error">{{ pantry.error }}</p>

    <!-- Item cards -->
    <TransitionGroup v-else-if="visibleItems.length" name="list" tag="div" class="list">
      <article v-for="item in visibleItems" :key="item.id" class="card item">
        <ItemRow :item="item" />
        <p v-if="item.expirationDateEstimated" class="estimated">Expiry date estimated by AI</p>
        <div class="actions" :class="{ urgent: isExpired(item) }">
          <button class="action eaten" @click="mark(item, 'eaten')">
            <Check :size="16" :stroke-width="2" /> Eaten
          </button>
          <button class="action thrown" @click="mark(item, 'thrown_away')">
            <Trash :size="16" :stroke-width="2" /> Thrown away
          </button>
        </div>
      </article>
    </TransitionGroup>

    <!-- Empty state -->
    <div v-else class="card empty">
      <p class="empty-title">Nothing here yet</p>
      <p class="empty-text">Scan your next receipt and your groceries appear here automatically.</p>
      <button class="btn-primary" @click="router.push('/scan')">
        <Camera :size="20" :stroke-width="1.75" /> Scan receipt
      </button>
    </div>
  </main>

  <Transition name="fade">
    <UndoToast v-if="toast" :message="toast.message" @undo="undo" />
  </Transition>
</template>

<style scoped>
.page { padding: 0 var(--page-padding); }

/* Filter chips */
.chips {
  display: flex;
  gap: 8px;
  margin: -8px calc(-1 * var(--page-padding)) 16px;
  padding: 0 var(--page-padding);
  overflow-x: auto;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar { display: none; }
.chip {
  flex-shrink: 0;
  padding: 7px 14px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
}
.chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-on-primary);
}

/* Item cards */
.list { display: flex; flex-direction: column; gap: 10px; }
.item { padding: 0 14px 12px; }
.estimated { margin: -6px 0 10px 52px; font-size: 11px; color: var(--color-text-muted); }
.actions { display: flex; gap: 8px; }
.action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
}
.eaten { background: var(--color-tile); color: var(--color-primary); }
.thrown { background: var(--color-surface-soft); color: var(--color-text-muted); }
.action:active { opacity: 0.8; }

/* Expired item: make the decision obvious */
.urgent .eaten { background: var(--color-primary); color: var(--color-on-primary); }
.urgent .thrown { background: var(--fresh-red-bg); color: var(--fresh-red-text); }

.note { padding: 18px; font-size: 14px; color: var(--color-text-muted); }
.note.error { color: var(--fresh-red-text); }

/* Empty state */
.empty { display: flex; flex-direction: column; gap: 8px; padding: 28px 22px; text-align: center; }
.empty-title { font-size: 17px; font-weight: 600; }
.empty-text { margin-bottom: 10px; font-size: 14px; color: var(--color-text-muted); }

/* Animations: cards slide away, toast fades */
.list-leave-active { transition: all 0.25s ease; }
.list-leave-to { opacity: 0; transform: translateX(40px); }
.list-move { transition: transform 0.25s ease; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>

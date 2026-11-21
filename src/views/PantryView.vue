<!--
  Pantry screen – MVP step 3 (pantry view) and step 5 (eaten / thrown away).
  - All items that are in stock, sorted by expiry (soonest first)
  - Traffic light badge with days left
  - Filter by storage place
  - "Eaten" / "Thrown away" buttons with an Undo hint
  - Empty state that leads to the receipt scan
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Camera,
  Check,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Trash,
} from "@lucide/vue";
import { addToList, isOnList } from "../data/shoppingList";
import PageHeader from "../components/PageHeader.vue";
import ItemRow from "../components/ItemRow.vue";
import UndoToast from "../components/UndoToast.vue";
import PullIndicator from "../components/PullIndicator.vue";
import { usePullToRefresh } from "../lib/pullToRefresh";
import {
  pantry,
  bySoonestExpiry,
  daysLeft,
  loadItems,
  remainingOf,
  setStatus,
  type ItemStatus,
  type PantryItem,
  type StoragePlace,
} from "../data/pantry";

const router = useRouter();
const { pull, refreshing } = usePullToRefresh(loadItems);

// ----- Filter by storage place -----
const filters: { label: string; value: StoragePlace | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Fridge", value: "Refrigerator" },
  { label: "Freezer", value: "Freezer" },
  { label: "Pantry", value: "Pantry" }, // includes "Room Temperature" from older scans
];
const activeFilter = ref<StoragePlace | "all">("all");

const visibleItems = computed(() =>
  activeFilter.value === "all"
    ? bySoonestExpiry.value
    : bySoonestExpiry.value.filter((i) => {
        const place =
          i.suggestedStoragePlace === "Room Temperature"
            ? "Pantry"
            : i.suggestedStoragePlace;
        return place === activeFilter.value;
      }),
);

/** Expired items get highlighted buttons (step 5) */
function isExpired(item: PantryItem) {
  const d = daysLeft(item.expirationDate);
  return d !== null && d < 0;
}

// ----- Eaten / thrown away with Undo -----
const toast = ref<{
  id: number;
  message: string;
  canUndo: boolean;
} | null>(null);
let toastTimer: number | undefined;

// ----- Quantity: how many units the next "Eaten" / "Thrown away" applies to -----
const amounts = ref<Record<number, number>>({});

/** Selected amount, clamped to what is left (default: 1 unit) */
function amountOf(item: PantryItem) {
  const left = remainingOf(item);
  return Math.min(Math.max(amounts.value[item.id] ?? 1, 1), left);
}

function changeAmount(item: PantryItem, step: number) {
  amounts.value[item.id] = Math.min(
    Math.max(amountOf(item) + step, 1),
    remainingOf(item),
  );
}

async function mark(item: PantryItem, status: ItemStatus) {
  const left = remainingOf(item);
  const amount = amountOf(item);
  const partial = amount < left;
  // Backend "undo" (status in_stock) resets the whole purchase – only safe if nothing was used before
  const untouched =
    (item.eatenQuantity ?? 0) + (item.discardedQuantity ?? 0) === 0;
  const failed = setStatus(
    item.id,
    status,
    partial ? amount : undefined,
  );
  delete amounts.value[item.id];
  const text = status === "eaten" ? "eaten" : "thrown away";
  toast.value = {
    id: item.id,
    message: partial
      ? `${amount}× ${item.name} ${text}`
      : `${item.name} marked as ${text}`,
    canUndo: !partial && untouched,
  };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), 4000);
  const error = await failed;
  if (error) {
    toast.value = { id: -1, message: error, canUndo: false };
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.value = null), 4000);
  }
}

function undo() {
  if (!toast.value || toast.value.id < 0) return;
  const id = toast.value.id;
  toast.value = null;
  setStatus(id, "in_stock").then((error) => {
    if (error)
      toast.value = { id: -1, message: error, canUndo: false };
  });
}
</script>

<template>
  <PageHeader
    mark
    title="Pantry"
    :subtitle="`${bySoonestExpiry.length} items · what expires first is on top`" />

  <main class="page">
    <PullIndicator :pull="pull" :refreshing="refreshing" />
    <!-- Filter chips (scroll sideways on small phones) -->
    <div class="chips">
      <!-- Add an item by hand (no receipt) – POST /Items with referenceDateSource "manual" -->
      <button
        class="chip add-chip"
        @click="router.push('/pantry/new')">
        <Plus :size="14" :stroke-width="2.5" /> Add item
      </button>
      <button
        v-for="f in filters"
        :key="f.value"
        class="chip"
        :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value">
        {{ f.label }}
      </button>
    </div>

    <p
      v-if="pantry.loading && !pantry.items.length"
      class="card note">
      Loading your pantry…
    </p>
    <p v-else-if="pantry.error" class="card note error">
      {{ pantry.error }}
    </p>

    <!-- Item cards -->
    <TransitionGroup
      v-else-if="visibleItems.length"
      name="list"
      tag="div"
      class="list">
      <article
        v-for="item in visibleItems"
        :key="item.id"
        class="card item">
        <ItemRow :item="item" />
        <p v-if="item.expirationDateEstimated" class="estimated">
          Expiry date estimated by AI
        </p>
        <!-- Quantity: only when more than one unit is left -->
        <div v-if="remainingOf(item) > 1" class="amount">
          <span class="amount-label">How many?</span>
          <button
            class="step"
            aria-label="Fewer"
            :disabled="amountOf(item) <= 1"
            @click="changeAmount(item, -1)">
            <Minus :size="14" :stroke-width="2" />
          </button>
          <span class="amount-value"
            >{{ amountOf(item) }} / {{ remainingOf(item) }}</span
          >
          <button
            class="step"
            aria-label="More"
            :disabled="amountOf(item) >= remainingOf(item)"
            @click="changeAmount(item, 1)">
            <Plus :size="14" :stroke-width="2" />
          </button>
        </div>
        <div class="actions" :class="{ urgent: isExpired(item) }">
          <button class="action eaten" @click="mark(item, 'eaten')">
            <Check :size="16" :stroke-width="2" /> Eaten
          </button>
          <button
            class="action thrown"
            @click="mark(item, 'thrown_away')">
            <Trash :size="16" :stroke-width="2" /> Bin
          </button>
          <!-- Step 3: "Add to list" – buy it again -->
          <button
            class="action cart"
            :class="{ added: isOnList(item.name) }"
            :aria-label="
              isOnList(item.name)
                ? 'On your shopping list'
                : 'Add to shopping list'
            "
            @click="addToList(item.name, 'pantry')">
            <component
              :is="isOnList(item.name) ? Check : ShoppingCart"
              :size="16"
              :stroke-width="2" />
          </button>
          <!-- Edit name, quantity, date, weight, price … (PUT /Items/{id}) -->
          <button
            class="action cart"
            :aria-label="`Edit ${item.name}`"
            @click="router.push(`/pantry/${item.id}/edit`)">
            <Pencil :size="16" :stroke-width="2" />
          </button>
        </div>
      </article>
    </TransitionGroup>

    <!-- Empty state -->
    <div v-else class="card empty">
      <p class="empty-title">Nothing here yet</p>
      <p class="empty-text">
        Scan your next receipt and your groceries appear here
        automatically.
      </p>
      <button class="btn-primary" @click="router.push('/scan')">
        <Camera :size="20" :stroke-width="1.75" /> Scan receipt
      </button>
      <button class="add-manual" @click="router.push('/pantry/new')">
        or add an item by hand
      </button>
    </div>
  </main>

  <Transition name="fade">
    <UndoToast
      v-if="toast"
      :message="toast.message"
      :can-undo="toast.canUndo"
      @undo="undo" />
  </Transition>
</template>

<style scoped>
.page {
  padding: 0 var(--page-padding);
}

/* "Add item" chip at the end of the filter row */
.chip.add-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-style: dashed;
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}
.add-manual {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

/* Filter chips */
.chips {
  display: flex;
  gap: 8px;
  margin: -8px calc(-1 * var(--page-padding)) 16px;
  padding: 0 var(--page-padding);
  overflow-x: auto;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar {
  display: none;
}
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
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item {
  padding: 0 14px 12px;
}
.estimated {
  margin: -6px 0 10px 52px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.amount {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
}
.amount-label {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-muted);
}
.amount-value {
  min-width: 48px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.step {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-primary);
}
.step:disabled {
  opacity: 0.4;
}
.actions {
  display: flex;
  gap: 8px;
}
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
.eaten {
  background: var(--color-tile);
  color: var(--color-primary);
}
.thrown {
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
}
.cart {
  flex: 0 0 44px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
}
.cart.added {
  background: var(--color-tile);
  color: var(--color-primary);
}
.action:active {
  opacity: 0.8;
}

/* Expired item: make the decision obvious */
.urgent .eaten {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.urgent .thrown {
  background: var(--fresh-red-bg);
  color: var(--fresh-red-text);
}

.note {
  padding: 18px;
  font-size: 14px;
  color: var(--color-text-muted);
}
.note.error {
  color: var(--fresh-red-text);
}

/* Empty state */
.empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px 22px;
  text-align: center;
}
.empty-title {
  font-size: 17px;
  font-weight: 600;
}
.empty-text {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--color-text-muted);
}

/* Animations: cards slide away, toast fades */
.list-leave-active {
  transition: all 0.25s ease;
}
.list-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
.list-move {
  transition: transform 0.25s ease;
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

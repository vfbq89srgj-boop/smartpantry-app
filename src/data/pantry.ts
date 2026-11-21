/*
  Pantry data for the app.

  For now this uses SAMPLE DATA so we can design the screens without the backend.
  The item shape matches the backend's StoredFoodItemDto (GET /api/v1/Items),
  so later we only replace the sample list with the API response.
*/
import { computed, reactive } from 'vue'
import { apiConfigured, apiFetch } from '../api/client'

export type StoragePlace = 'Refrigerator' | 'Freezer' | 'Pantry' | 'Room Temperature'
export type ItemStatus = 'in_stock' | 'eaten' | 'thrown_away'

export interface PantryItem {
  id: number
  name: string
  quantity: number | null
  category: string               // backend category code, e.g. "fresh_milk"
  suggestedStoragePlace: StoragePlace
  expirationDate: string | null  // "YYYY-MM-DD"
  expirationDateEstimated: boolean
  status: ItemStatus             // step 5 – saved in the backend via PATCH /Items/{id}/status
  statusChangedAt: string | null // when it was marked eaten / thrown away
}

/** Date string "YYYY-MM-DD" that is `days` away from today */
function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const sampleItems: PantryItem[] = [
  { id: 1, name: 'Milk', quantity: 1, category: 'fresh_milk', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(0), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 2, name: 'Baby spinach', quantity: 1, category: 'leafy_greens', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(2), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 3, name: 'Minced beef', quantity: 1, category: 'minced_meat', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(1), expirationDateEstimated: false, status: 'in_stock', statusChangedAt: null },
  { id: 4, name: 'Greek yogurt', quantity: 2, category: 'dairy', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(3), expirationDateEstimated: false, status: 'in_stock', statusChangedAt: null },
  { id: 5, name: 'Tomatoes', quantity: 6, category: 'vegetables', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(5), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 6, name: 'Eggs', quantity: 10, category: 'eggs', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(18), expirationDateEstimated: false, status: 'in_stock', statusChangedAt: null },
  { id: 7, name: 'Wholegrain bread', quantity: 1, category: 'bakery', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(-1), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 8, name: 'Pasta', quantity: 2, category: 'dry_goods', suggestedStoragePlace: 'Pantry', expirationDate: inDays(320), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 9, name: 'Frozen peas', quantity: 1, category: 'frozen', suggestedStoragePlace: 'Freezer', expirationDate: inDays(180), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 10, name: 'Apples', quantity: 4, category: 'fruit', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(9), expirationDateEstimated: true, status: 'in_stock', statusChangedAt: null },
  { id: 11, name: 'Oat drink', quantity: 1, category: 'plant_based', suggestedStoragePlace: 'Pantry', expirationDate: null, expirationDateEstimated: false, status: 'in_stock', statusChangedAt: null },
  { id: 12, name: 'Bananas', quantity: 3, category: 'fruit', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(-2), expirationDateEstimated: true, status: 'eaten', statusChangedAt: inDays(-1) },
  { id: 13, name: 'Lettuce', quantity: 1, category: 'leafy_greens', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(-3), expirationDateEstimated: true, status: 'thrown_away', statusChangedAt: inDays(-1) },
]

/** The shared state – every screen reads from here */
export const pantry = reactive({
  // Demo mode (no VITE_API_URL): sample data. Otherwise filled by loadItems().
  items: apiConfigured ? ([] as PantryItem[]) : sampleItems,
  loading: false,
  error: '',
})

// ---------------------------------------------------------------------------
// Backend: GET /api/v1/Items and POST /api/v1/Items (see Smart-Pantry/docs/API.md)
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** GET one page. The first database call after a login sometimes fails with 503 – retry a few times. */
async function fetchPage(page: number) {
  const attempts = 3
  for (let attempt = 1; ; attempt++) {
    let retryable = false
    try {
      const res = await apiFetch(`/api/v1/Items?page=${page}&pageSize=100`)
      if (res.ok) return (await res.json()) as { items: Omit<PantryItem, 'status' | 'statusChangedAt'>[]; totalCount: number }
      retryable = res.status === 503
      if (!retryable || attempt === attempts) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      // a rejected fetch() (network error) is retried too; HTTP errors other than 503 are not
      if (!(e instanceof TypeError)) throw e
      if (attempt === attempts) throw e
    }
    await sleep(500 * attempt)
  }
}

/** Loads all of the user's in-stock items from the backend (all pages) */
export async function loadItems() {
  if (!apiConfigured) return
  pantry.loading = true
  pantry.error = ''
  try {
    const all: PantryItem[] = []
    for (let page = 1; ; page++) {
      const data = await fetchPage(page)
      for (const item of data.items) all.push({ ...item, status: 'in_stock', statusChangedAt: null })
      if (all.length >= data.totalCount || data.items.length === 0) break
    }
    pantry.items = all
  } catch {
    pantry.error = 'Could not load your pantry. Is the backend running?'
  } finally {
    pantry.loading = false
  }
}

/** Items that are still in the pantry */
export const inStock = computed(() => pantry.items.filter((i) => i.status === 'in_stock'))

/** In-stock items sorted by expiry date, soonest first (items without a date last) */
export const bySoonestExpiry = computed(() =>
  [...inStock.value].sort((a, b) => (a.expirationDate ?? '9999').localeCompare(b.expirationDate ?? '9999')),
)

/** Our status names → the backend's ("thrown_away" is called "discarded" there) */
const apiStatus: Record<ItemStatus, string> = { in_stock: 'in_stock', eaten: 'eaten', thrown_away: 'discarded' }

/**
  Step 5 of our plan: mark an item as eaten or thrown away (or back to in stock for "Undo").
  Nothing is deleted – the Impact screen counts these later.
  Backend: PATCH /api/v1/Items/{id}/status. The screen updates immediately and
  rolls back if the server refuses. Returns an error message or null.
*/
export async function setStatus(id: number, status: ItemStatus): Promise<string | null> {
  const item = pantry.items.find((i) => i.id === id)
  if (!item) return null
  const before = { status: item.status, statusChangedAt: item.statusChangedAt }
  item.status = status
  item.statusChangedAt = status === 'in_stock' ? null : new Date().toISOString()
  if (!apiConfigured) return null

  try {
    const res = await apiFetch(`/api/v1/Items/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: apiStatus[status] }),
    })
    if (res.ok) {
      const data = (await res.json()) as { statusChangedAt: string | null }
      item.statusChangedAt = data.statusChangedAt
      return null
    }
    Object.assign(item, before)
    return res.status === 401 ? 'Your login has expired. Please sign in again.' : 'Could not save the change. Please try again.'
  } catch {
    Object.assign(item, before)
    return 'No connection to the server.'
  }
}

export type NewItem = Omit<PantryItem, 'id' | 'status' | 'statusChangedAt'>

/**
  Saves confirmed items from a receipt scan (step 1: "Save to pantry").
  With backend: POST /api/v1/Items, then reload. Demo mode: add locally.
  Returns an error message or null.
*/
export async function addItems(newItems: NewItem[], referenceDate: string, referenceDateSource: string): Promise<string | null> {
  if (!apiConfigured) {
    let nextId = Math.max(0, ...pantry.items.map((i) => i.id)) + 1
    for (const item of newItems) pantry.items.push({ ...item, id: nextId++, status: 'in_stock', statusChangedAt: null })
    return null
  }
  try {
    const res = await apiFetch('/api/v1/Items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceDate,
        referenceDateSource,
        items: newItems.map((i) => ({ ...i, storageNote: null, estimationNote: null })),
      }),
    })
    if (!res.ok) return res.status === 401 ? 'Your login has expired. Please sign in again.' : 'Saving failed. Please try again.'
    await loadItems()
    return null
  } catch {
    return 'No connection to the server.'
  }
}

/** Whole days from today until the date (negative = already expired) */
export function daysLeft(date: string | null): number | null {
  if (!date) return null
  const today = new Date(new Date().toISOString().slice(0, 10))
  return Math.round((new Date(date).getTime() - today.getTime()) / 86_400_000)
}

export type Freshness = 'red' | 'amber' | 'green' | 'grey'

/** Traffic light from our plan: red ≤ 1 day, amber 2–3 days, green > 3 days, grey = no date */
export function freshness(date: string | null): Freshness {
  const d = daysLeft(date)
  if (d === null) return 'grey'
  if (d <= 1) return 'red'
  if (d <= 3) return 'amber'
  return 'green'
}

/** Short label for the badge, e.g. "Today", "In 2 days", "Expired" */
export function expiryLabel(date: string | null): string {
  const d = daysLeft(date)
  if (d === null) return 'No date'
  if (d < 0) return 'Expired'
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `In ${d} days`
}

/** Friendlier names for the storage places */
export const storageLabel: Record<StoragePlace, string> = {
  Refrigerator: 'Fridge',
  Freezer: 'Freezer',
  Pantry: 'Pantry',
  'Room Temperature': 'Room temp.',
}

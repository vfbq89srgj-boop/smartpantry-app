/*
  Pantry data for the app.

  For now this uses SAMPLE DATA so we can design the screens without the backend.
  The item shape matches the backend's StoredFoodItemDto (GET /api/v1/Items),
  so later we only replace the sample list with the API response.
*/
import { computed, reactive } from 'vue'

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
  status: ItemStatus             // step 5 – not in the backend yet
}

/** Date string "YYYY-MM-DD" that is `days` away from today */
function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const sampleItems: PantryItem[] = [
  { id: 1, name: 'Milk', quantity: 1, category: 'fresh_milk', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(0), expirationDateEstimated: true, status: 'in_stock' },
  { id: 2, name: 'Baby spinach', quantity: 1, category: 'leafy_greens', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(2), expirationDateEstimated: true, status: 'in_stock' },
  { id: 3, name: 'Minced beef', quantity: 1, category: 'minced_meat', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(1), expirationDateEstimated: false, status: 'in_stock' },
  { id: 4, name: 'Greek yogurt', quantity: 2, category: 'dairy', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(3), expirationDateEstimated: false, status: 'in_stock' },
  { id: 5, name: 'Tomatoes', quantity: 6, category: 'vegetables', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(5), expirationDateEstimated: true, status: 'in_stock' },
  { id: 6, name: 'Eggs', quantity: 10, category: 'eggs', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(18), expirationDateEstimated: false, status: 'in_stock' },
  { id: 7, name: 'Wholegrain bread', quantity: 1, category: 'bakery', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(-1), expirationDateEstimated: true, status: 'in_stock' },
  { id: 8, name: 'Pasta', quantity: 2, category: 'dry_goods', suggestedStoragePlace: 'Pantry', expirationDate: inDays(320), expirationDateEstimated: true, status: 'in_stock' },
  { id: 9, name: 'Frozen peas', quantity: 1, category: 'frozen', suggestedStoragePlace: 'Freezer', expirationDate: inDays(180), expirationDateEstimated: true, status: 'in_stock' },
  { id: 10, name: 'Apples', quantity: 4, category: 'fruit', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(9), expirationDateEstimated: true, status: 'in_stock' },
  { id: 11, name: 'Oat drink', quantity: 1, category: 'plant_based', suggestedStoragePlace: 'Pantry', expirationDate: null, expirationDateEstimated: false, status: 'in_stock' },
  { id: 12, name: 'Bananas', quantity: 3, category: 'fruit', suggestedStoragePlace: 'Room Temperature', expirationDate: inDays(-2), expirationDateEstimated: true, status: 'eaten' },
  { id: 13, name: 'Lettuce', quantity: 1, category: 'leafy_greens', suggestedStoragePlace: 'Refrigerator', expirationDate: inDays(-3), expirationDateEstimated: true, status: 'thrown_away' },
]

/** The shared state – every screen reads from here */
export const pantry = reactive({
  items: sampleItems,
  shoppingListCount: 5,
})

/** Items that are still in the pantry */
export const inStock = computed(() => pantry.items.filter((i) => i.status === 'in_stock'))

/** In-stock items sorted by expiry date, soonest first (items without a date last) */
export const bySoonestExpiry = computed(() =>
  [...inStock.value].sort((a, b) => (a.expirationDate ?? '9999').localeCompare(b.expirationDate ?? '9999')),
)

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

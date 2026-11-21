/*
  Shopping list – MVP step 3.
  Add, check off, delete. No duplicates. Every entry remembers where it came from
  (manual, pantry or recipe = missing ingredient from step 4).

  For now it is saved on the phone (localStorage).
  TODO backend: GET · POST · PATCH · DELETE shopping list API once Benny adds it.
*/
import { computed, reactive, watch } from 'vue'

export type ListSource = 'manual' | 'pantry' | 'recipe'

export interface ListEntry {
  id: number
  name: string
  checked: boolean
  source: ListSource
}

const STORAGE_KEY = 'pantrix.shoppingList'

function load(): ListEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore – start with the default list
  }
  return [
    { id: 1, name: 'Oat drink', checked: false, source: 'manual' },
    { id: 2, name: 'Onions', checked: false, source: 'recipe' },
    { id: 3, name: 'Bread', checked: false, source: 'pantry' },
  ]
}

export const shoppingList = reactive({ entries: load() })

// Save automatically whenever something changes
watch(
  () => shoppingList.entries,
  (entries) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // storage not available
    }
  },
  { deep: true },
)

/** Entries that still need to be bought */
export const openEntries = computed(() => shoppingList.entries.filter((e) => !e.checked))
export const checkedEntries = computed(() => shoppingList.entries.filter((e) => e.checked))

/** Adds an entry unless the same name is already open on the list. Returns false for duplicates. */
export function addToList(name: string, source: ListSource = 'manual'): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  const clean = trimmed[0].toUpperCase() + trimmed.slice(1) // "parmesan" → "Parmesan"
  const duplicate = openEntries.value.some((e) => e.name.toLowerCase() === clean.toLowerCase())
  if (duplicate) return false
  const id = Math.max(0, ...shoppingList.entries.map((e) => e.id)) + 1
  shoppingList.entries.unshift({ id, name: clean, checked: false, source })
  return true
}

export function isOnList(name: string): boolean {
  return openEntries.value.some((e) => e.name.toLowerCase() === name.trim().toLowerCase())
}

export function toggleEntry(id: number) {
  const entry = shoppingList.entries.find((e) => e.id === id)
  if (entry) entry.checked = !entry.checked
}

export function removeEntry(id: number) {
  shoppingList.entries = shoppingList.entries.filter((e) => e.id !== id)
}

export function clearChecked() {
  shoppingList.entries = shoppingList.entries.filter((e) => !e.checked)
}

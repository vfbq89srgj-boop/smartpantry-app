/*
  Shopping list – MVP step 3.
  Add, check off, delete. No duplicates. Every entry remembers where it came from
  (manual, pantry or recipe = missing ingredient from step 4).

  Backend (Benny's endpoints, see Smart-Pantry/docs/API.md):
    GET    /api/v1/ShoppingList          → [{ id, name, quantity, isChecked, createdAt }]
    POST   /api/v1/ShoppingList          { name, quantity? }
    PATCH  /api/v1/ShoppingList/{id}     { isChecked }
    DELETE /api/v1/ShoppingList/{id}
*/
import { computed, reactive, watch } from "vue";
import { apiConfigured, apiFetch } from "../api/client";

export type ListSource = "manual" | "pantry" | "recipe";

export interface ListEntry {
  id: number;
  name: string;
  checked: boolean;
  source: ListSource;
  quantity?: number | null;
}

interface ApiItem {
  id: number;
  name: string;
  quantity: number | null;
  isChecked: boolean;
  createdAt: string;
}

const STORAGE_KEY = "pantrix.shoppingList";
const SOURCE_KEY = "pantrix.shoppingListSources";

function loadDemo(): ListEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore – start with the default list
  }
  return [
    { id: 1, name: "Oat drink", checked: false, source: "manual" },
    { id: 2, name: "Onions", checked: false, source: "recipe" },
    { id: 3, name: "Bread", checked: false, source: "pantry" },
  ];
}

function loadSources(): Record<string, ListSource> {
  try {
    return JSON.parse(localStorage.getItem(SOURCE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSources(sources: Record<string, ListSource>) {
  try {
    localStorage.setItem(SOURCE_KEY, JSON.stringify(sources));
  } catch {
    // storage not available
  }
}

export const shoppingList = reactive({
  entries: apiConfigured ? ([] as ListEntry[]) : loadDemo(),
  loading: false,
  error: "",
});

// Demo mode only: save automatically whenever something changes
if (!apiConfigured) {
  watch(
    () => shoppingList.entries,
    (entries) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {
        // storage not available
      }
    },
    { deep: true },
  );
}

/** Entries that still need to be bought */
export const openEntries = computed(() =>
  shoppingList.entries.filter((e) => !e.checked),
);
export const checkedEntries = computed(() =>
  shoppingList.entries.filter((e) => e.checked),
);

// ---------------------------------------------------------------------------
// Backend helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function errorMessage(status: number): string {
  return status === 401
    ? "Your login has expired. Please sign in again."
    : "Could not save the change. Please try again.";
}

function fromApi(
  item: ApiItem,
  sources: Record<string, ListSource>,
): ListEntry {
  return {
    id: item.id,
    name: item.name,
    checked: item.isChecked,
    quantity: item.quantity,
    source: sources[item.id] ?? "manual",
  };
}

/** Loads the user's list from the backend. The first DB call after a login sometimes fails with 503 – retried. */
export async function loadShoppingList() {
  if (!apiConfigured) return;
  shoppingList.loading = true;
  shoppingList.error = "";
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await apiFetch("/api/v1/ShoppingList");
        if (res.ok) {
          const sources = loadSources();
          const items = (await res.json()) as ApiItem[];
          shoppingList.entries = items.map((i) =>
            fromApi(i, sources),
          );
          return;
        }
        if (res.status !== 503 || attempt === 3)
          throw new Error(`HTTP ${res.status}`);
      } catch (e) {
        if (!(e instanceof TypeError) || attempt === 3) throw e;
      }
      await sleep(500 * attempt);
    }
  } catch {
    shoppingList.error = "Could not load your shopping list.";
  } finally {
    shoppingList.loading = false;
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Adds an entry unless the same name is already open on the list. Returns false for duplicates. */
export function addToList(
  name: string,
  source: ListSource = "manual",
): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const clean = trimmed[0].toUpperCase() + trimmed.slice(1); // "parmesan" → "Parmesan"
  const duplicate = openEntries.value.some(
    (e) => e.name.toLowerCase() === clean.toLowerCase(),
  );
  if (duplicate) return false;

  // Demo-mode ids are positive; temporary ids for unsaved entries are negative
  const id = apiConfigured
    ? Math.min(0, ...shoppingList.entries.map((e) => e.id)) - 1
    : Math.max(0, ...shoppingList.entries.map((e) => e.id)) + 1;
  shoppingList.entries.unshift({
    id,
    name: clean,
    checked: false,
    source,
  });
  if (apiConfigured) void saveNew(id, clean, source);
  return true;
}

async function saveNew(
  tempId: number,
  name: string,
  source: ListSource,
) {
  const drop = () =>
    (shoppingList.entries = shoppingList.entries.filter(
      (e) => e.id !== tempId,
    ));
  try {
    const res = await apiFetch("/api/v1/ShoppingList", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      drop();
      shoppingList.error =
        res.status === 400
          ? "That name is not valid (max. 200 characters)."
          : errorMessage(res.status);
      return;
    }
    const item = (await res.json()) as ApiItem;
    const entry = shoppingList.entries.find((e) => e.id === tempId);
    if (entry) entry.id = item.id;
    saveSources({ ...loadSources(), [item.id]: source });
  } catch {
    drop();
    shoppingList.error = "No connection to the server.";
  }
}

export function isOnList(name: string): boolean {
  return openEntries.value.some(
    (e) => e.name.toLowerCase() === name.trim().toLowerCase(),
  );
}

export async function toggleEntry(id: number) {
  const entry = shoppingList.entries.find((e) => e.id === id);
  if (!entry) return;
  entry.checked = !entry.checked;
  if (!apiConfigured || id < 0) return; // unsaved entries (id < 0) are still being created

  shoppingList.error = "";
  try {
    const res = await apiFetch(`/api/v1/ShoppingList/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked: entry.checked }),
    });
    if (!res.ok) {
      entry.checked = !entry.checked;
      shoppingList.error = errorMessage(res.status);
    }
  } catch {
    entry.checked = !entry.checked;
    shoppingList.error = "No connection to the server.";
  }
}

/** Deletes on the server. A 404 counts as success (already gone). Returns true when it worked. */
async function deleteOnServer(id: number): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/v1/ShoppingList/${id}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 404) return true;
    shoppingList.error = errorMessage(res.status);
  } catch {
    shoppingList.error = "No connection to the server.";
  }
  return false;
}

export async function removeEntry(id: number) {
  const index = shoppingList.entries.findIndex((e) => e.id === id);
  if (index === -1) return;
  const [entry] = shoppingList.entries.splice(index, 1);
  if (!apiConfigured || id < 0) return;

  shoppingList.error = "";
  if (!(await deleteOnServer(id)))
    shoppingList.entries.splice(
      Math.min(index, shoppingList.entries.length),
      0,
      entry,
    );
}

export async function clearChecked() {
  const removed = shoppingList.entries.filter((e) => e.checked);
  shoppingList.entries = shoppingList.entries.filter(
    (e) => !e.checked,
  );
  if (!apiConfigured) return;

  // There is no "delete all" endpoint, so delete one by one and put back what failed
  shoppingList.error = "";
  const results = await Promise.all(
    removed.map((e) => (e.id < 0 ? true : deleteOnServer(e.id))),
  );
  const failed = removed.filter((_, i) => !results[i]);
  if (failed.length) shoppingList.entries.push(...failed);
}

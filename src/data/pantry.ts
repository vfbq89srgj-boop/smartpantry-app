/*
  Pantry data for the app.

  For now this uses SAMPLE DATA so we can design the screens without the backend.
  The item shape matches the backend's StoredFoodItemDto (GET /api/v1/Items),
  so later we only replace the sample list with the API response.
*/
import { computed, reactive } from "vue";
import { apiConfigured, apiFetch } from "../api/client";
import { inDays, localDateString } from "../lib/date";

export type StoragePlace =
  | "Refrigerator"
  | "Freezer"
  | "Pantry"
  | "Room Temperature";
export type ItemStatus = "in_stock" | "eaten" | "thrown_away";

export interface PantryItem {
  id: number;
  name: string;
  quantity: number | null; // originally purchased amount (never changes)
  remainingQuantity?: number; // what is still left (backend); missing = same as quantity
  eatenQuantity?: number;
  discardedQuantity?: number;
  category: string; // backend category code, e.g. "fresh_milk"
  suggestedStoragePlace: StoragePlace;
  expirationDate: string | null; // "YYYY-MM-DD"
  expirationDateEstimated: boolean;
  weightKg?: number | null; // total weight of the receipt line (all units)
  storageNote?: string | null;
  estimationNote?: string | null;
  price?: number | null; // EUR for the whole receipt line
  status: ItemStatus; // step 5 – saved in the backend via PATCH /Items/{id}/status
  statusChangedAt: string | null; // when it was marked eaten / thrown away
}

const sampleItems: PantryItem[] = [
  {
    id: 1,
    name: "Milk",
    quantity: 1,
    category: "fresh_milk",
    suggestedStoragePlace: "Refrigerator",
    expirationDate: inDays(0),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 2,
    name: "Baby spinach",
    quantity: 1,
    category: "leafy_greens",
    suggestedStoragePlace: "Refrigerator",
    expirationDate: inDays(2),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 3,
    name: "Minced beef",
    quantity: 1,
    category: "minced_meat",
    suggestedStoragePlace: "Refrigerator",
    expirationDate: inDays(1),
    expirationDateEstimated: false,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 4,
    name: "Greek yogurt",
    quantity: 2,
    category: "dairy",
    suggestedStoragePlace: "Refrigerator",
    expirationDate: inDays(3),
    expirationDateEstimated: false,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 5,
    name: "Tomatoes",
    quantity: 6,
    category: "vegetables",
    suggestedStoragePlace: "Pantry",
    expirationDate: inDays(5),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 6,
    name: "Eggs",
    quantity: 10,
    category: "eggs",
    suggestedStoragePlace: "Refrigerator",
    expirationDate: inDays(18),
    expirationDateEstimated: false,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 7,
    name: "Wholegrain bread",
    quantity: 1,
    category: "bakery",
    suggestedStoragePlace: "Pantry",
    expirationDate: inDays(-1),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 8,
    name: "Pasta",
    quantity: 2,
    category: "dry_goods",
    suggestedStoragePlace: "Pantry",
    expirationDate: inDays(320),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 9,
    name: "Frozen peas",
    quantity: 1,
    category: "frozen",
    suggestedStoragePlace: "Freezer",
    expirationDate: inDays(180),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 10,
    name: "Apples",
    quantity: 4,
    category: "fruit",
    suggestedStoragePlace: "Pantry",
    expirationDate: inDays(9),
    expirationDateEstimated: true,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 11,
    name: "Oat drink",
    quantity: 1,
    category: "plant_based",
    suggestedStoragePlace: "Pantry",
    expirationDate: null,
    expirationDateEstimated: false,
    status: "in_stock",
    statusChangedAt: null,
  },
  {
    id: 12,
    name: "Bananas",
    quantity: 3,
    category: "fruit",
    suggestedStoragePlace: "Pantry",
    expirationDate: inDays(-2),
    expirationDateEstimated: true,
    status: "eaten",
    statusChangedAt: inDays(-1),
  },
  {
    id: 13,
    name: "Lettuce",
    quantity: 1,
    category: "leafy_greens",
    suggestedStoragePlace: "Refrigerator",
    expirationDate: inDays(-3),
    expirationDateEstimated: true,
    status: "thrown_away",
    statusChangedAt: inDays(-1),
  },
];

/** The shared state – every screen reads from here */
export const pantry = reactive({
  // Demo mode (no VITE_API_URL): sample data. Otherwise filled by loadItems().
  items: apiConfigured ? ([] as PantryItem[]) : sampleItems,
  loading: false,
  error: "",
});

// ---------------------------------------------------------------------------
// Backend: GET /api/v1/Items and POST /api/v1/Items (see Smart-Pantry/docs/API.md)
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET one page. The first database call after a login sometimes fails with 503 – retry a few times. */
async function fetchPage(page: number) {
  const attempts = 3;
  for (let attempt = 1; ; attempt++) {
    let retryable = false;
    try {
      const res = await apiFetch(
        `/api/v1/Items?page=${page}&pageSize=100`,
      );
      if (res.ok)
        return (await res.json()) as {
          items: Omit<PantryItem, "status" | "statusChangedAt">[];
          totalCount: number;
        };
      retryable = res.status === 503;
      if (!retryable || attempt === attempts)
        throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      // a rejected fetch() (network error) is retried too; HTTP errors other than 503 are not
      if (!(e instanceof TypeError)) throw e;
      if (attempt === attempts) throw e;
    }
    await sleep(500 * attempt);
  }
}

/** Loads all of the user's in-stock items from the backend (all pages) */
export async function loadItems() {
  if (!apiConfigured) return;
  pantry.loading = true;
  pantry.error = "";
  try {
    const all: PantryItem[] = [];
    for (let page = 1; ; page++) {
      const data = await fetchPage(page);
      for (const item of data.items)
        all.push({
          ...item,
          status: "in_stock",
          statusChangedAt: null,
        });
      if (all.length >= data.totalCount || data.items.length === 0)
        break;
    }
    pantry.items = all;
  } catch {
    pantry.error =
      "Could not load your pantry. Pull down to try again.";
  } finally {
    pantry.loading = false;
  }
}

/** Items that are still in the pantry */
export const inStock = computed(() =>
  pantry.items.filter((i) => i.status === "in_stock"),
);

/** In-stock items sorted by expiry date, soonest first (items without a date last) */
export const bySoonestExpiry = computed(() =>
  [...inStock.value].sort((a, b) =>
    (a.expirationDate ?? "9999").localeCompare(
      b.expirationDate ?? "9999",
    ),
  ),
);

/** Our status names → the backend's ("thrown_away" is called "discarded" there) */
const apiStatus: Record<ItemStatus, string> = {
  in_stock: "in_stock",
  eaten: "eaten",
  thrown_away: "discarded",
};

/**
  Step 5 of our plan: mark an item as eaten or thrown away (or back to in stock for "Undo").
  Nothing is deleted – the Impact screen counts these later.
  Backend: PATCH /api/v1/Items/{id}/status. The screen updates immediately and
  rolls back if the server refuses. Returns an error message or null.
*/
/** How many units of the item are still in the pantry */
/** Fields that can be changed later (PUT /api/v1/Items/{id}) */
export interface ItemEdit {
  name: string;
  quantity: number; // purchased amount – at least what was already eaten / thrown away
  category: string;
  suggestedStoragePlace: StoragePlace;
  expirationDate: string | null;
  expirationDateEstimated: boolean;
  weightKg: number | null; // total weight of the purchase
  price: number | null; // total price of the purchase
}

/** Units already eaten or thrown away – quantity can't go below this */
export function usedOf(item: PantryItem): number {
  return (item.eatenQuantity ?? 0) + (item.discardedQuantity ?? 0);
}

/**
  Edit a saved item. PUT replaces the whole item, so notes the user can't see
  are sent back unchanged. Eaten / thrown-away counters stay as they are.
  Returns an error message or null.
*/
export async function updateItem(id: number, edit: ItemEdit): Promise<string | null> {
  const item = pantry.items.find((i) => i.id === id);
  if (!item) return "Item not found.";

  if (!apiConfigured) {
    Object.assign(item, edit, { remainingQuantity: edit.quantity - usedOf(item) });
    return null;
  }
  try {
    const res = await apiFetch(`/api/v1/Items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...edit,
        unreadable: false,
        storageNote: item.storageNote ?? null,
        estimationNote: item.estimationNote ?? null,
      }),
    });
    if (res.ok) {
      await loadItems(); // quantities / status may have changed
      return null;
    }
    if (res.status === 401) return "Your login has expired. Please sign in again.";
    if (res.status === 404) return "This item no longer exists.";
    if (res.status === 400) {
      const body = await res.json().catch(() => null);
      return body?.message ?? "Please check your input.";
    }
    return "Saving failed. Please try again.";
  } catch {
    return "No connection to the server.";
  }
}

/** Delete an item for good (DELETE /api/v1/Items/{id}). Returns an error message or null. */
export async function deleteItem(id: number): Promise<string | null> {
  if (!apiConfigured) {
    pantry.items = pantry.items.filter((i) => i.id !== id);
    return null;
  }
  try {
    const res = await apiFetch(`/api/v1/Items/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 404) {
      pantry.items = pantry.items.filter((i) => i.id !== id);
      return null;
    }
    if (res.status === 401) return "Your login has expired. Please sign in again.";
    return "Deleting failed. Please try again.";
  } catch {
    return "No connection to the server.";
  }
}

export function remainingOf(item: PantryItem): number {
  return item.remainingQuantity ?? item.quantity ?? 1;
}

/**
  `quantity` (optional) = only that many units, e.g. "ate 2 of 6". Without it the whole
  remaining stock is processed. Partial updates keep the item in stock while units remain.
  For "in_stock" (undo) the whole item is reset – partial undo is not supported by the backend.
*/
export async function setStatus(
  id: number,
  status: ItemStatus,
  quantity?: number,
): Promise<string | null> {
  const item = pantry.items.find((i) => i.id === id);
  if (!item) return null;
  const before = {
    status: item.status,
    statusChangedAt: item.statusChangedAt,
    remainingQuantity: item.remainingQuantity,
    eatenQuantity: item.eatenQuantity,
    discardedQuantity: item.discardedQuantity,
  };
  const total = item.quantity ?? 1;
  const remaining = remainingOf(item);
  const amount =
    status === "in_stock"
      ? total
      : Math.min(quantity ?? remaining, remaining);

  // optimistic update
  if (status === "in_stock") {
    item.remainingQuantity = total;
    item.eatenQuantity = 0;
    item.discardedQuantity = 0;
    item.status = "in_stock";
    item.statusChangedAt = null;
  } else {
    item.remainingQuantity = remaining - amount;
    if (status === "eaten")
      item.eatenQuantity = (item.eatenQuantity ?? 0) + amount;
    else
      item.discardedQuantity = (item.discardedQuantity ?? 0) + amount;
    item.status = item.remainingQuantity > 0 ? "in_stock" : status;
    item.statusChangedAt = new Date().toISOString();
  }
  if (!apiConfigured) return null;

  try {
    const body: { status: string; quantity?: number } = {
      status: apiStatus[status],
    };
    if (quantity !== undefined && status !== "in_stock")
      body.quantity = amount;
    const res = await apiFetch(`/api/v1/Items/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        status: string;
        statusChangedAt: string | null;
        remainingQuantity: number;
        eatenQuantity: number;
        discardedQuantity: number;
      };
      item.statusChangedAt = data.statusChangedAt;
      item.remainingQuantity = data.remainingQuantity;
      item.eatenQuantity = data.eatenQuantity;
      item.discardedQuantity = data.discardedQuantity;
      return null;
    }
    Object.assign(item, before);
    return res.status === 401
      ? "Your login has expired. Please sign in again."
      : "Could not save the change. Please try again.";
  } catch {
    Object.assign(item, before);
    return "No connection to the server.";
  }
}

export type NewItem = Omit<
  PantryItem,
  "id" | "status" | "statusChangedAt"
>;

/**
  Saves confirmed items from a receipt scan (step 1: "Save to pantry").
  With backend: POST /api/v1/Items, then reload. Demo mode: add locally.
  Returns an error message or null.
*/
export async function addItems(
  newItems: NewItem[],
  referenceDate: string,
  referenceDateSource: string,
  fileHash?: string | null,
): Promise<string | null> {
  if (!apiConfigured) {
    let nextId = Math.max(0, ...pantry.items.map((i) => i.id)) + 1;
    for (const item of newItems)
      pantry.items.push({
        ...item,
        id: nextId++,
        status: "in_stock",
        statusChangedAt: null,
      });
    return null;
  }
  try {
    const res = await apiFetch("/api/v1/Items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceDate,
        referenceDateSource,
        fileHash, // exactly as POST /Receipts returned it – without it no duplicate is detected
        items: newItems.map((i) => ({
          ...i,
          storageNote: null,
          estimationNote: null,
        })),
      }),
    });
    if (!res.ok)
      return res.status === 401
        ? "Your login has expired. Please sign in again."
        : "Saving failed. Please try again.";
    await loadItems();
    return null;
  } catch {
    return "No connection to the server.";
  }
}

/** Whole days from today until the date (negative = already expired) */
export function daysLeft(date: string | null): number | null {
  if (!date) return null;
  const today = new Date(localDateString());
  return Math.round(
    (new Date(date).getTime() - today.getTime()) / 86_400_000,
  );
}

export type Freshness = "red" | "amber" | "green" | "grey";

/** Traffic light from our plan: red ≤ 1 day, amber 2–3 days, green > 3 days, grey = no date */
export function freshness(date: string | null): Freshness {
  const d = daysLeft(date);
  if (d === null) return "grey";
  if (d <= 1) return "red";
  if (d <= 3) return "amber";
  return "green";
}

/** Short label for the badge, e.g. "Today", "In 2 days", "Expired" */
export function expiryLabel(date: string | null): string {
  const d = daysLeft(date);
  if (d === null) return "No date";
  if (d < 0) return "Expired";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `In ${d} days`;
}

/** Friendlier names for the storage places */
export const storageLabel: Record<StoragePlace, string> = {
  Refrigerator: "Fridge",
  Freezer: "Freezer",
  Pantry: "Pantry",
  "Room Temperature": "Pantry", // shown as Pantry – the app only uses Fridge / Freezer / Pantry
};

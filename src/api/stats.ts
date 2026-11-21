/*
  Statistics from Benny's backend (eaten / thrown away / remaining per item).
  DEMO MODE: without VITE_API_URL the same shape is built from the local sample data.
*/
import { apiConfigured, apiFetch } from "./client";
import { pantry } from "../data/pantry";
import { daysLeft } from "../data/pantry";

// TODO: confirm the exact path with Benny
const STATS_PATH = "/api/v1/Statistics";

export interface StatsItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  purchaseDate: string;
  status: "in_stock" | "eaten" | "discarded";
  statusChangedAt: string | null;
  expirationDate: string | null;
  expirationDateEstimated: boolean;
  remainingQuantity: number;
  eatenQuantity: number;
  discardedQuantity: number;
  // coming from the receipt later (Benny) – optional until then
  weightKg?: number | null;
  price?: number | null; // EUR per unit (DB column food_items.price)
}

export interface Stats {
  days: number;
  summary: {
    itemsPurchased: number;
    itemsEaten: number;
    itemsWasted: number;
    itemsRemaining: number;
    itemsExpired: number;
  };
  items: StatsItem[];
  expiredItems: StatsItem[];
  /** set by the app when the backend refused the period and a shorter one is shown */
  fallbackDays?: number;
}

/** Longest period the backend accepts today (allowed: 7, 30, 90) */
const MAX_BACKEND_DAYS = 90;

/** Period used for "All time" (10 years) */
export const ALL_TIME_DAYS = 3650;

/** Custom period, both dates "YYYY-MM-DD" (inclusive) */
export interface DateRange {
  from: string;
  to: string;
}

/** "2026-11-21" → "21.11.2026" (date format of the backend's custom period) */
const toBackendDate = (d: string) => d.split("-").reverse().join(".");

/** "YYYY-MM-DD" that is `days` before today (local time) */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/*
  7 / 30 / 90 days → ?days=…
  everything else (year, all time, custom) → Benny's custom period:
    ?period=custom&startDate=01.10.2025&endDate=11.12.2026
*/
export async function fetchStats(days: number, range?: DateRange): Promise<Stats> {
  if (!apiConfigured) return demoStats(days);
  if (!range && ![7, 30, 90].includes(days)) range = { from: daysAgo(days - 1), to: daysAgo(0) };
  let res: Response;
  try {
    const query = range
      ? `period=custom&startDate=${toBackendDate(range.from)}&endDate=${toBackendDate(range.to)}`
      : `days=${days}`;
    res = await apiFetch(`${STATS_PATH}?${query}`);
  } catch {
    throw new Error("No connection to the server.");
  }
  if (res.ok) return (await res.json()) as Stats;
  // Backend refuses longer / custom periods (for now only 7, 30, 90) → show the last 90 days instead
  if (res.status === 400 && (days !== MAX_BACKEND_DAYS || range)) {
    const shorter = await fetchStats(MAX_BACKEND_DAYS);
    return { ...shorter, fallbackDays: MAX_BACKEND_DAYS };
  }
  if (res.status === 401)
    throw new Error("Your login has expired. Please sign in again.");
  if (res.status === 404)
    throw new Error(
      "Statistics are not available on this backend yet.",
    );
  throw new Error(
    "Could not load your statistics. Please try again.",
  );
}

function demoStats(days: number): Stats {
  const items: StatsItem[] = pantry.items.map((i) => {
    const q = i.quantity ?? 1;
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: q,
      purchaseDate: "",
      status: i.status === "thrown_away" ? "discarded" : i.status,
      statusChangedAt: i.statusChangedAt,
      expirationDate: i.expirationDate,
      expirationDateEstimated: i.expirationDateEstimated,
      remainingQuantity: i.status === "in_stock" ? q : 0,
      eatenQuantity: i.status === "eaten" ? q : 0,
      discardedQuantity: i.status === "thrown_away" ? q : 0,
    };
  });
  const sum = (f: (i: StatsItem) => number) =>
    items.reduce((a, i) => a + f(i), 0);
  const expiredItems = items.filter(
    (i) =>
      i.remainingQuantity > 0 &&
      (daysLeft(i.expirationDate) ?? 0) < 0,
  );
  return {
    days,
    summary: {
      itemsPurchased: sum((i) => i.quantity),
      itemsEaten: sum((i) => i.eatenQuantity),
      itemsWasted: sum((i) => i.discardedQuantity),
      itemsRemaining: sum((i) => i.remainingQuantity),
      itemsExpired: expiredItems.reduce(
        (a, i) => a + i.remainingQuantity,
        0,
      ),
    },
    items,
    expiredItems,
  };
}

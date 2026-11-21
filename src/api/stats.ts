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
  unitPrice?: number | null;
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
}

/** Period used for "All time" (10 years) */
export const ALL_TIME_DAYS = 3650;

export async function fetchStats(days: number): Promise<Stats> {
  if (!apiConfigured) return demoStats(days);
  let res: Response;
  try {
    res = await apiFetch(`${STATS_PATH}?days=${days}`);
  } catch {
    throw new Error("No connection to the server.");
  }
  if (res.ok) return (await res.json()) as Stats;
  // Backend may limit the period – then show one year instead of "all time"
  if (res.status === 400 && days > 365) return fetchStats(365);
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

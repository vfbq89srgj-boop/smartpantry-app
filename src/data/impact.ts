/*
  Impact calculations (agreed with the team):
  1. Usage rate      = eaten / (eaten + thrown away)               – measured, no estimate
  2. Thrown away kg  = Σ thrown-away quantity × weight per item     – estimated
  3. Money lost      = Σ thrown-away quantity × price per item      – estimated
  4. CO2e wasted     = kg × CO2e factor (shown as a range) + car km  – estimated
  5. Your household vs. the Austrian average (kg per person per week)
  Weight / price come from the receipt when available, otherwise from the category defaults.
*/
import { reactive } from 'vue'
import { fetchStats, type DateRange, type Stats, type StatsItem } from '../api/stats'
import { localDateString } from '../lib/date'
import { AVG_WASTE_KG_PER_PERSON_WEEK, CAR_KG_CO2_PER_KM, factorFor } from './impactFactors'

const HOUSEHOLD_KEY = 'pantrix.householdSize'

function savedHousehold(): number {
  try {
    const n = Number(localStorage.getItem(HOUSEHOLD_KEY))
    return n >= 1 && n <= 8 ? n : 1
  } catch {
    return 1
  }
}

export const impactState = reactive({
  days: 30,
  custom: null as DateRange | null, // set when "Custom" is chosen
  householdSize: savedHousehold(),
  stats: null as Stats | null,
  loading: false,
  error: '',
})

export function setHouseholdSize(n: number) {
  impactState.householdSize = Math.min(8, Math.max(1, n))
  try {
    localStorage.setItem(HOUSEHOLD_KEY, String(impactState.householdSize))
  } catch {
    // not saved – fine
  }
}

export async function loadImpact() {
  impactState.loading = true
  impactState.error = ''
  try {
    impactState.stats = impactState.custom
      ? await fetchStats(daysBetween(impactState.custom.from, localDateString()), impactState.custom)
      : await fetchStats(impactState.days)
  } catch (e) {
    impactState.error = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    impactState.loading = false
  }
}

/** Days from `from` to `to`, both included */
export function daysBetween(from: string, to: string): number {
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1)
}

/** Length of the selected period in days (for the per-week comparison) */
export function periodDays(): number {
  return impactState.custom ? daysBetween(impactState.custom.from, impactState.custom.to) : impactState.days
}

// Weight per unit: backend weightKg is the TOTAL of the receipt line → divide by quantity
const weightOf = (i: StatsItem) =>
  (i.weightKg != null && i.quantity ? i.weightKg / i.quantity : null) ?? factorFor(i.category).weightKg
// Price per unit: from the backend, else line price ÷ quantity, else the category default
const priceOf = (i: StatsItem) =>
  i.unitPrice ?? (i.price != null && i.quantity ? i.price / i.quantity : null) ?? factorFor(i.category).priceEur

export function calculateImpact(stats: Stats, days: number, householdSize: number) {
  const eaten = stats.summary.itemsEaten
  const wasted = stats.summary.itemsWasted
  const finished = eaten + wasted
  const thrown = stats.items.filter((i) => i.discardedQuantity > 0)

  const wastedKg = thrown.reduce((a, i) => a + i.discardedQuantity * weightOf(i), 0)
  const moneyLost = thrown.reduce((a, i) => a + i.discardedQuantity * priceOf(i), 0)
  const co2 = thrown.reduce((a, i) => a + i.discardedQuantity * weightOf(i) * factorFor(i.category).co2PerKg, 0)
  const co2Min = thrown.reduce((a, i) => a + i.discardedQuantity * weightOf(i) * factorFor(i.category).co2Min, 0)
  const co2Max = thrown.reduce((a, i) => a + i.discardedQuantity * weightOf(i) * factorFor(i.category).co2Max, 0)

  // Weeks actually covered: from the first purchase in the period until today (max. the chosen period)
  const firstPurchase = stats.items
    .map((i) => i.purchaseDate)
    .filter(Boolean)
    .sort()[0]
  const spanDays = firstPurchase
    ? Math.min(days, Math.ceil((Date.now() - new Date(firstPurchase).getTime()) / 86_400_000) + 1)
    : days
  const weeks = Math.max(1, spanDays / 7)
  const yourKgPerPersonWeek = wastedKg / weeks / householdSize

  // Categories thrown away most (by quantity)
  const byCategory = new Map<string, number>()
  for (const i of thrown) byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + i.discardedQuantity)
  const topWasted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  return {
    eaten,
    wasted,
    finished,
    usageRate: finished ? eaten / finished : null,
    wastedKg,
    moneyLost,
    co2,
    co2Min,
    co2Max,
    carKm: co2 / CAR_KG_CO2_PER_KM,
    yourKgPerPersonWeek,
    avgKgPerPersonWeek: AVG_WASTE_KG_PER_PERSON_WEEK,
    belowAverage: yourKgPerPersonWeek <= AVG_WASTE_KG_PER_PERSON_WEEK,
    topWasted,
    expired: stats.expiredItems.filter((i) => i.remainingQuantity > 0),
  }
}

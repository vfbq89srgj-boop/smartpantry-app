/*
  Default values per category for the Impact tab.
  Used when an item has no weight / price from the receipt yet.
  Sources (see research page "Impact Meter für Pantrix"):
  - CO2e per kg: ifeu 2020 for the German Umweltbundesamt ("at the supermarket checkout"),
    gaps filled with Umweltbundesamt Austria (Klimabilanz NÖ 2019). min/max = range across sources.
  - Weight: typical Austrian supermarket package (team assumption, no official source).
  - Price: AK Wien price check Sept 2026 × 1.3 where available, otherwise team assumption.
*/
export interface ImpactFactor {
  weightKg: number   // per item
  co2PerKg: number   // kg CO2e per kg food
  co2Min: number
  co2Max: number
  priceEur: number   // per item
}

export const FACTORS_VERSION = 'v1 · Nov 2026'

export const impactFactors: Record<string, ImpactFactor> = {
  fresh_milk:   { weightKg: 1.03, co2PerKg: 1.4, co2Min: 1.1,  co2Max: 1.7,  priceEur: 1.7 },
  dairy:        { weightKg: 0.5,  co2PerKg: 2.5, co2Min: 1.3,  co2Max: 9.0,  priceEur: 2.0 },
  cheese:       { weightKg: 0.2,  co2PerKg: 5.7, co2Min: 5.5,  co2Max: 7.4,  priceEur: 1.75 },
  eggs:         { weightKg: 0.6,  co2PerKg: 3.0, co2Min: 1.3,  co2Max: 4.7,  priceEur: 3.25 },
  minced_meat:  { weightKg: 0.5,  co2PerKg: 6.9, co2Min: 4.6,  co2Max: 9.2,  priceEur: 5.0 },
  meat:         { weightKg: 0.5,  co2PerKg: 6.0, co2Min: 4.6,  co2Max: 13.6, priceEur: 6.5 },
  cold_cuts:    { weightKg: 0.15, co2PerKg: 3.5, co2Min: 2.9,  co2Max: 7.9,  priceEur: 2.25 },
  fish:         { weightKg: 0.3,  co2PerKg: 4.0, co2Min: 2.4,  co2Max: 12.5, priceEur: 3.5 },
  fruit:        { weightKg: 0.75, co2PerKg: 0.4, co2Min: 0.2,  co2Max: 0.8,  priceEur: 1.5 },
  vegetables:   { weightKg: 0.5,  co2PerKg: 0.6, co2Min: 0.1,  co2Max: 2.9,  priceEur: 1.2 },
  leafy_greens: { weightKg: 0.15, co2PerKg: 0.4, co2Min: 0.3,  co2Max: 0.4,  priceEur: 1.5 },
  bakery:       { weightKg: 0.5,  co2PerKg: 0.7, co2Min: 0.55, co2Max: 1.6,  priceEur: 1.5 },
  ready_meals:  { weightKg: 0.4,  co2PerKg: 1.5, co2Min: 1.3,  co2Max: 1.6,  priceEur: 3.5 },
  plant_based:  { weightKg: 0.6,  co2PerKg: 0.5, co2Min: 0.3,  co2Max: 1.0,  priceEur: 2.0 },
  frozen:       { weightKg: 0.5,  co2PerKg: 1.0, co2Min: 0.6,  co2Max: 12.5, priceEur: 2.0 },
  dry_goods:    { weightKg: 0.75, co2PerKg: 1.0, co2Min: 0.6,  co2Max: 3.1,  priceEur: 1.2 },
  canned:       { weightKg: 0.4,  co2PerKg: 1.6, co2Min: 1.2,  co2Max: 2.4,  priceEur: 1.0 },
  condiments:   { weightKg: 0.3,  co2PerKg: 1.5, co2Min: 1.2,  co2Max: 1.9,  priceEur: 2.0 },
  snacks:       { weightKg: 0.2,  co2PerKg: 2.0, co2Min: 0.9,  co2Max: 4.1,  priceEur: 2.0 },
  beverages:    { weightKg: 1.0,  co2PerKg: 0.5, co2Min: 0.2,  co2Max: 1.7,  priceEur: 1.5 },
  other:        { weightKg: 0.4,  co2PerKg: 1.0, co2Min: 0.5,  co2Max: 3.0,  priceEur: 2.0 },
}

export function factorFor(category: string): ImpactFactor {
  return impactFactors[category] ?? impactFactors.other
}

/** Benchmarks */
export const AVG_WASTE_KG_PER_PERSON_WEEK = 69 / 52 // Austria 2024: 69 kg/person/year (BMLUK) ≈ 1.33 kg/week
export const CAR_KG_CO2_PER_KM = 0.107             // average new car EU 2024 (EEA, WLTP)

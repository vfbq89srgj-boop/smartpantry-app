/*
  Dates in the phone's local time zone (Austria), not UTC.
  toISOString() would give yesterday's date between midnight and 1 am (2 am in summer).
*/
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "YYYY-MM-DD" that is `days` away from today */
export function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateString(d)
}

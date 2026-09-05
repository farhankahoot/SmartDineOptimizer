/**
 * Booking dates are stored as ISO (`2026-09-14`) so they sort and group
 * correctly. Screens show a readable label instead.
 *
 * Anything that is not an ISO date — the older display-string rows — is passed
 * through unchanged, so a mixed table still renders sensibly.
 */
const ISO = /^\d{4}-\d{2}-\d{2}$/

export function formatBookingDate(value: string): string {
  if (!ISO.test(value)) return value
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Adds the weekday, for detail screens where there is room for it. */
export function formatBookingDateLong(value: string): string {
  if (!ISO.test(value)) return value
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * The dates a booking form may offer, starting today.
 *
 * Every booking form uses this so they cannot drift apart or offer a date the
 * server will reject. Values are ISO because that is the format the booking
 * rules parse and the column sorts on; the label is what the user reads.
 */
export function bookableDateOptions(days = 30, includeToday = true) {
  const out: { value: string; label: string }[] = []

  for (let i = includeToday ? 0 : 1; i <= days; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const value = toIsoDate(d)
    const label = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    out.push({ value, label: i === 0 ? `Today · ${label}` : label })
  }

  return out
}

/** Local-time ISO date. `toISOString()` would shift across the day in PKT. */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

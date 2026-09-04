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

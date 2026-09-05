/**
 * Reservation domain rules shared by the public booking form (Module 1) and the
 * admin console (Module 2). Availability and double-booking live here so both
 * entry points enforce the same thing.
 */
import { prisma } from '../db.js'
import { badRequest, conflict } from './http.js'
import { getRules } from './settings.js'

/**
 * Booking dates are stored as ISO so they sort, group and compare correctly.
 *
 * Accepting a display string like "May 24, 2025" instead would put two formats
 * in one column: availability checks would miss clashes between them, and the
 * scheduler could not parse the slot time at all. The format is therefore
 * rejected at the edge rather than tolerated.
 */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function assertIsoDate(date: string): void {
  if (!ISO_DATE.test(date)) {
    throw badRequest('Date must be in YYYY-MM-DD form.', {
      date: 'Choose a date from the list.',
    })
  }
  if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    throw badRequest('That is not a real date.', { date: 'Choose a valid date.' })
  }
}

/** Statuses that hold a table. Anything else releases it (Module 3 FE-5). */
export const LIVE_STATUSES = ['Pending', 'Confirmed', 'Updated'] as const
export const CLEARED_STATUSES = ['Rejected', 'Cancelled', 'Completed'] as const

export type ReservationStatus = (typeof LIVE_STATUSES)[number] | (typeof CLEARED_STATUSES)[number]

export const isLive = (status: string): boolean =>
  (LIVE_STATUSES as readonly string[]).includes(status)

/** `activeHold` participates in the unique key; null releases the table. */
export const holdFor = (status: string): string | null => (isLive(status) ? 'held' : null)

/** Statuses a booking may move to from where it is now (Module 2 FE-2). */
const TRANSITIONS: Record<string, ReservationStatus[]> = {
  Pending: ['Confirmed', 'Updated', 'Rejected', 'Cancelled'],
  Confirmed: ['Updated', 'Cancelled', 'Completed'],
  Updated: ['Confirmed', 'Cancelled', 'Completed'],
  Rejected: [],
  Cancelled: [],
  Completed: [],
}

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] ?? []).includes(to as ReservationStatus)
}

export function allowedTransitions(from: string): ReservationStatus[] {
  return TRANSITIONS[from] ?? []
}

/** Sequential, human-readable booking reference for the public tracker. */
export async function nextReference(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await prisma.reservation.findFirst({
    where: { reference: { startsWith: `RES-${year}-` } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  })

  const lastNumber = last ? Number(last.reference.split('-').pop()) : 1000
  return `RES-${year}-${String((Number.isFinite(lastNumber) ? lastNumber : 1000) + 1).padStart(4, '0')}`
}

export interface AvailabilityQuery {
  date: string
  timeSlot: string
  guests?: number
  seating?: string
  /** Ignore this booking's own hold when checking (used when editing). */
  excludeReservationId?: string
}

/** Seating preference maps onto the floor sections (Module 1 FE-3). */
const SECTION_FOR_SEATING: Record<string, string | null> = {
  'No preference': null,
  'Window side': 'Window Side',
  Indoor: 'Main Hall',
  Outdoor: 'Outdoor Terrace',
  'Private room': 'Private Room',
  'Quiet corner': null,
}

/** Tables that can physically take the party and are not already held. */
export async function findAvailableTables(query: AvailabilityQuery) {
  const [tables, held] = await Promise.all([
    prisma.restaurantTable.findMany({
      where: { status: { notIn: ['Blocked', 'Unavailable'] } },
      orderBy: [{ seats: 'asc' }, { code: 'asc' }],
    }),
    prisma.reservation.findMany({
      where: {
        date: query.date,
        timeSlot: query.timeSlot,
        activeHold: 'held',
        ...(query.excludeReservationId ? { NOT: { id: query.excludeReservationId } } : {}),
      },
      select: { tableCode: true },
    }),
  ])

  const takenCodes = new Set(held.map((h) => h.tableCode))
  const section = query.seating ? SECTION_FOR_SEATING[query.seating] ?? null : null

  return tables
    .filter((t) => !takenCodes.has(t.code))
    .filter((t) => (query.guests ? t.seats >= query.guests : true))
    .filter((t) => (section ? t.section === section : true))
}

/**
 * Picks the smallest table that fits, so a party of two does not consume the
 * ten-seat private room while a larger booking is turned away.
 */
export async function assignTable(query: AvailabilityQuery): Promise<string> {
  const candidates = await findAvailableTables(query)
  if (candidates.length > 0) return candidates[0].code

  // Nothing in the preferred section — fall back to any table that fits before
  // refusing the booking outright.
  if (query.seating && query.seating !== 'No preference') {
    const anywhere = await findAvailableTables({ ...query, seating: undefined })
    if (anywhere.length > 0) return anywhere[0].code
  }

  throw conflict('No table is available for that date, time and party size.', {
    date: query.date,
    timeSlot: query.timeSlot,
  })
}

/** Rejects a table that is blocked, too small, or already held. */
export async function assertTableFree(
  tableCode: string,
  query: AvailabilityQuery,
): Promise<void> {
  const table = await prisma.restaurantTable.findUnique({ where: { code: tableCode } })
  if (!table) throw conflict(`Table ${tableCode} does not exist.`)
  if (table.status === 'Blocked' || table.status === 'Unavailable') {
    throw conflict(`Table ${tableCode} is ${table.status.toLowerCase()}.`)
  }
  if (query.guests && table.seats < query.guests) {
    throw conflict(`Table ${tableCode} seats ${table.seats}, but the party is ${query.guests}.`)
  }

  const rules = await getRules()
  if (!rules.preventDoubleBooking) return

  const clash = await prisma.reservation.findFirst({
    where: {
      tableCode,
      date: query.date,
      timeSlot: query.timeSlot,
      activeHold: 'held',
      ...(query.excludeReservationId ? { NOT: { id: query.excludeReservationId } } : {}),
    },
    select: { reference: true },
  })

  if (clash) {
    throw conflict(`Table ${tableCode} is already booked for that slot (${clash.reference}).`)
  }
}

/** Party size and lead time, checked against the admin's reservation rules. */
export async function assertRules(input: { guests: number; date: string }): Promise<void> {
  const rules = await getRules()

  if (input.guests < rules.minPartySize || input.guests > rules.maxPartySize) {
    throw conflict(
      `Party size must be between ${rules.minPartySize} and ${rules.maxPartySize} guests.`,
      { guests: `Between ${rules.minPartySize} and ${rules.maxPartySize} guests.` },
    )
  }

  assertIsoDate(input.date)
  const target = new Date(`${input.date}T00:00:00Z`)

  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const daysAhead = Math.round((target.getTime() - todayUtc) / 86_400_000)

  if (daysAhead < 0) {
    throw conflict('That date has already passed.', { date: 'Choose a date in the future.' })
  }
  if (daysAhead === 0 && !rules.allowSameDay) {
    throw conflict('Same-day booking is closed. Please choose a later date.', {
      date: 'Same-day booking is closed.',
    })
  }
  if (daysAhead > rules.advanceDays) {
    throw conflict(`Bookings open ${rules.advanceDays} days ahead.`, {
      date: `Choose a date within ${rules.advanceDays} days.`,
    })
  }
}

/** The shape every reservation endpoint returns. */
export function serialize(r: {
  id: string
  reference: string
  customerName: string
  phone: string
  email: string
  date: string
  timeSlot: string
  guests: number
  occasion: string
  seating: string
  tableCode: string
  specialRequest: string
  source: string
  status: string
  createdAt: Date
  updatedAt: Date
  events?: { status: string; note: string; actorName: string; at: Date }[]
}) {
  return {
    id: r.id,
    reference: r.reference,
    customerName: r.customerName,
    phone: r.phone,
    email: r.email,
    date: r.date,
    timeSlot: r.timeSlot,
    guests: r.guests,
    occasion: r.occasion,
    seating: r.seating,
    table: r.tableCode,
    specialRequest: r.specialRequest,
    source: r.source,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    allowedTransitions: allowedTransitions(r.status),
    history: (r.events ?? []).map((e) => ({
      status: e.status,
      note: e.note,
      by: e.actorName,
      at: e.at,
    })),
  }
}

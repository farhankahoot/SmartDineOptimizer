/**
 * Module 2 — admin reservation management: the worklist, approvals, edits,
 * manual entry and the full status history.
 */
import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { badRequest, conflict, notFound, pageMeta, paginate, parse, route } from '../lib/http.js'
import { sendReservationMessage } from '../lib/mailer.js'
import {
  assertRules,
  assertTableFree,
  assignTable,
  canTransition,
  holdFor,
  nextReference,
  serialize,
} from '../lib/reservations.js'
import { requirePermission } from '../middleware/auth.js'

export const reservationsRouter = Router()

const view = requirePermission('view:reservations')
const manage = requirePermission('manage:reservations')

const ACTIVE = ['Pending', 'Confirmed', 'Updated']
const HISTORY = ['Completed', 'Cancelled', 'Rejected']

/** Module 2 FE-1/FE-5 — the filtered, paginated worklist. */
reservationsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        tab: z.enum(['active', 'history', 'all']).default('all'),
        status: z.string().optional(),
        occasion: z.string().optional(),
        timeSlot: z.string().optional(),
        source: z.string().optional(),
        date: z.string().optional(),
        search: z.string().optional(),
        partySize: z.string().optional(),
        page: z.coerce.number().optional(),
        perPage: z.coerce.number().optional(),
        sort: z.enum(['newest', 'oldest', 'date']).default('newest'),
      }),
      req.query,
    )

    const where: Prisma.ReservationWhereInput = {}

    if (q.tab === 'active') where.status = { in: ACTIVE }
    else if (q.tab === 'history') where.status = { in: HISTORY }
    if (q.status && !q.status.startsWith('All')) where.status = q.status
    if (q.occasion && !q.occasion.startsWith('All')) where.occasion = q.occasion
    if (q.timeSlot && !q.timeSlot.startsWith('All')) where.timeSlot = q.timeSlot
    if (q.source && !q.source.startsWith('All')) where.source = q.source
    if (q.date) where.date = q.date

    if (q.search) {
      const term = q.search.trim()
      where.OR = [
        { customerName: { contains: term } },
        { reference: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
        { tableCode: { contains: term } },
      ]
    }

    const bounds = partySizeBounds(q.partySize)
    if (bounds) where.guests = bounds

    const { page, perPage, skip, take } = paginate(q)
    const orderBy: Prisma.ReservationOrderByWithRelationInput =
      q.sort === 'oldest' ? { createdAt: 'asc' } : q.sort === 'date' ? { date: 'asc' } : { createdAt: 'desc' }

    const [rows, total] = await Promise.all([
      prisma.reservation.findMany({ where, orderBy, skip, take }),
      prisma.reservation.count({ where }),
    ])

    res.json({ reservations: rows.map((r) => serialize(r)), meta: pageMeta(total, page, perPage) })
  }),
)

/** Header KPI row — counted from the database, not a constant. */
reservationsRouter.get(
  '/stats',
  view,
  route(async (_req, res) => {
    const [total, pending, confirmed, cancelled, guestsToday] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'Pending' } }),
      prisma.reservation.count({ where: { status: 'Confirmed' } }),
      prisma.reservation.count({ where: { status: 'Cancelled' } }),
      prisma.reservation.aggregate({
        _sum: { guests: true },
        where: { status: { in: ACTIVE } },
      }),
    ])

    res.json({
      total,
      pending,
      confirmed,
      cancelled,
      guests: guestsToday._sum.guests ?? 0,
    })
  }),
)

/** Upcoming bookings strip on the dashboard. */
reservationsRouter.get(
  '/upcoming',
  view,
  route(async (_req, res) => {
    const rows = await prisma.reservation.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
      take: 8,
    })
    res.json({
      bookings: rows.map((r) => ({
        time: r.timeSlot,
        name: r.customerName,
        guests: r.guests,
        table: r.tableCode,
        reference: r.reference,
        id: r.id,
      })),
    })
  }),
)

reservationsRouter.get(
  '/:id',
  view,
  route(async (req, res) => {
    const reservation = await findOne(req.params.id)
    res.json({ reservation: serialize(reservation) })
  }),
)

/* ------------------------------------------------------------- mutations */

const manualEntry = z.object({
  customerName: z.string().trim().min(2, 'Enter the guest name.'),
  phone: z.string().trim().min(7, 'Enter a contact number.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  date: z.string().trim().min(1, 'Choose a date.'),
  timeSlot: z.string().trim().min(1, 'Choose a time slot.'),
  guests: z.coerce.number().int().positive('Enter the number of guests.'),
  occasion: z.string().trim().default('Other'),
  seating: z.string().trim().default('No preference'),
  table: z.string().trim().optional(),
  specialRequest: z.string().trim().max(500).default(''),
  source: z.string().trim().default('Manual Entry'),
  status: z.enum(['Pending', 'Confirmed']).default('Confirmed'),
})

/** Module 2 FE-6 — manual entry for phone and walk-in bookings. */
reservationsRouter.post(
  '/',
  manage,
  route(async (req, res) => {
    const input = parse(manualEntry, req.body)
    await assertRules(input)

    let tableCode: string
    if (input.table) {
      await assertTableFree(input.table, {
        date: input.date,
        timeSlot: input.timeSlot,
        guests: input.guests,
      })
      tableCode = input.table
    } else {
      tableCode = await assignTable({
        date: input.date,
        timeSlot: input.timeSlot,
        guests: input.guests,
        seating: input.seating,
      })
    }

    const created = await prisma.reservation.create({
      data: {
        reference: await nextReference(),
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        date: input.date,
        timeSlot: input.timeSlot,
        guests: input.guests,
        occasion: input.occasion,
        seating: input.seating,
        tableCode,
        specialRequest: input.specialRequest,
        source: input.source,
        status: input.status,
        activeHold: holdFor(input.status),
        events: {
          create: [
            { status: 'Submitted', note: 'Entered by the restaurant.', actorName: req.user!.name },
            ...(input.status === 'Confirmed'
              ? [{ status: 'Confirmed', note: 'Table assigned and confirmed.', actorName: req.user!.name }]
              : []),
          ],
        },
      },
      include: { events: { orderBy: { at: 'asc' } } },
    })

    if (input.specialRequest) {
      await prisma.specialRequest.create({
        data: {
          reservationId: created.id,
          reference: created.reference,
          customerName: created.customerName,
          date: created.date,
          timeSlot: created.timeSlot,
          tableCode: created.tableCode,
          occasion: created.occasion,
          request: created.specialRequest,
          status: 'Pending',
        },
      })
    }

    if (created.status === 'Confirmed') await sendReservationMessage(created, 'Confirmation')

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Created reservation', target: created.reference, category: 'Reservation' })
    res.status(201).json({ reservation: serialize(created) })
  }),
)

/** Module 2 FE-3/FE-4 — edit a booking's details. */
reservationsRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await findOne(req.params.id)
    const input = parse(manualEntry.partial().omit({ status: true, source: true }), req.body)

    const date = input.date ?? existing.date
    const timeSlot = input.timeSlot ?? existing.timeSlot
    const guests = input.guests ?? existing.guests
    const tableCode = input.table ?? existing.tableCode

    if (input.date || input.guests) await assertRules({ guests, date })

    // Re-check the slot whenever anything that affects the hold moves.
    const moved =
      date !== existing.date || timeSlot !== existing.timeSlot || tableCode !== existing.tableCode
    if (moved || (input.guests && input.guests !== existing.guests)) {
      await assertTableFree(tableCode, {
        date,
        timeSlot,
        guests,
        excludeReservationId: existing.id,
      })
    }

    const changes = describeChanges(existing, { date, timeSlot, guests, tableCode })
    // An edit moves a live booking to "Updated" so the guest is told; a cleared
    // booking keeps its final status.
    const status = holdFor(existing.status) ? 'Updated' : existing.status

    const updated = await prisma.reservation.update({
      where: { id: existing.id },
      data: {
        customerName: input.customerName ?? existing.customerName,
        phone: input.phone ?? existing.phone,
        email: input.email ?? existing.email,
        date,
        timeSlot,
        guests,
        occasion: input.occasion ?? existing.occasion,
        seating: input.seating ?? existing.seating,
        tableCode,
        specialRequest: input.specialRequest ?? existing.specialRequest,
        status,
        activeHold: holdFor(status),
        events: {
          create: {
            status,
            note: changes.length ? `Updated: ${changes.join(', ')}.` : 'Booking details revised.',
            actorName: req.user!.name,
          },
        },
      },
      include: { events: { orderBy: { at: 'asc' } } },
    })

    if (status === 'Updated') await sendReservationMessage(updated, 'Update')

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated reservation', target: updated.reference, category: 'Reservation' })
    res.json({ reservation: serialize(updated) })
  }),
)

/** Module 2 FE-2 — approve, reject, cancel or complete. */
reservationsRouter.post(
  '/:id/status',
  manage,
  route(async (req, res) => {
    const { status, note } = parse(
      z.object({
        status: z.enum(['Confirmed', 'Updated', 'Rejected', 'Cancelled', 'Completed']),
        note: z.string().trim().max(300).optional(),
      }),
      req.body,
    )

    const existing = await findOne(req.params.id)

    if (existing.status === status) throw badRequest(`This booking is already ${status.toLowerCase()}.`)
    if (!canTransition(existing.status, status)) {
      throw conflict(`A ${existing.status.toLowerCase()} booking cannot become ${status.toLowerCase()}.`)
    }

    // Confirming re-checks the table: it may have been taken while pending.
    if (status === 'Confirmed') {
      await assertTableFree(existing.tableCode, {
        date: existing.date,
        timeSlot: existing.timeSlot,
        guests: existing.guests,
        excludeReservationId: existing.id,
      })
    }

    const updated = await prisma.reservation.update({
      where: { id: existing.id },
      data: {
        status,
        activeHold: holdFor(status),
        events: { create: { status, note: note ?? defaultNote(status), actorName: req.user!.name } },
      },
      include: { events: { orderBy: { at: 'asc' } } },
    })

    if (status === 'Confirmed') await sendReservationMessage(updated, 'Confirmation')
    if (status === 'Cancelled' || status === 'Rejected') {
      await sendReservationMessage(updated, 'Cancellation')
    }

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: `${status} reservation`, target: updated.reference, category: 'Reservation' })
    res.json({ reservation: serialize(updated) })
  }),
)

/** Bulk approve or reject from the worklist. */
reservationsRouter.post(
  '/bulk-status',
  manage,
  route(async (req, res) => {
    const { ids, status } = parse(
      z.object({
        ids: z.array(z.string().min(1)).min(1, 'Select at least one reservation.'),
        status: z.enum(['Confirmed', 'Rejected', 'Cancelled', 'Completed']),
      }),
      req.body,
    )

    const results: { id: string; ok: boolean; error?: string }[] = []

    for (const id of ids) {
      try {
        const existing = await prisma.reservation.findUnique({ where: { id } })
        if (!existing) throw new Error('Not found.')
        if (!canTransition(existing.status, status)) {
          throw new Error(`Cannot move from ${existing.status} to ${status}.`)
        }
        if (status === 'Confirmed') {
          await assertTableFree(existing.tableCode, {
            date: existing.date,
            timeSlot: existing.timeSlot,
            guests: existing.guests,
            excludeReservationId: existing.id,
          })
        }

        const updated = await prisma.reservation.update({
          where: { id },
          data: {
            status,
            activeHold: holdFor(status),
            events: { create: { status, note: defaultNote(status), actorName: req.user!.name } },
          },
        })

        if (status === 'Confirmed') await sendReservationMessage(updated, 'Confirmation')
        if (status === 'Cancelled' || status === 'Rejected') {
          await sendReservationMessage(updated, 'Cancellation')
        }
        results.push({ id, ok: true })
      } catch (err) {
        results.push({ id, ok: false, error: err instanceof Error ? err.message : 'Failed.' })
      }
    }

    const changed = results.filter((r) => r.ok).length
    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: `Bulk ${status.toLowerCase()} reservations`,
      target: `${changed} of ${ids.length}`,
      category: 'Reservation',
      result: changed === ids.length ? 'Success' : 'Failed',
    })

    res.json({ changed, results })
  }),
)

/** Resends the confirmation for a booking (Module 8 FE-7). */
reservationsRouter.post(
  '/:id/resend',
  manage,
  route(async (req, res) => {
    const reservation = await findOne(req.params.id)
    await sendReservationMessage(reservation, reservation.status === 'Cancelled' ? 'Cancellation' : 'Confirmation')
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Resent reservation message', target: reservation.reference, category: 'Message' })
    res.json({ ok: true })
  }),
)

/* --------------------------------------------------------------- helpers */

async function findOne(id: string) {
  // Accepts either the internal id or the customer-facing reference.
  const reservation = await prisma.reservation.findFirst({
    where: { OR: [{ id }, { reference: id.toUpperCase() }] },
    include: { events: { orderBy: { at: 'asc' } } },
  })
  if (!reservation) throw notFound('Reservation not found.')
  return reservation
}

function defaultNote(status: string): string {
  switch (status) {
    case 'Confirmed':
      return 'Table assigned and confirmation sent.'
    case 'Rejected':
      return 'No table available for the requested slot.'
    case 'Cancelled':
      return 'Cancelled by the restaurant.'
    case 'Completed':
      return 'Guests seated and visit completed.'
    default:
      return 'Booking details revised by the restaurant.'
  }
}

function describeChanges(
  before: { date: string; timeSlot: string; guests: number; tableCode: string },
  after: { date: string; timeSlot: string; guests: number; tableCode: string },
): string[] {
  const out: string[] = []
  if (before.date !== after.date) out.push(`date ${before.date} → ${after.date}`)
  if (before.timeSlot !== after.timeSlot) out.push(`time ${before.timeSlot} → ${after.timeSlot}`)
  if (before.guests !== after.guests) out.push(`party ${before.guests} → ${after.guests}`)
  if (before.tableCode !== after.tableCode) out.push(`table ${before.tableCode} → ${after.tableCode}`)
  return out
}

function partySizeBounds(bucket?: string): Prisma.IntFilter | undefined {
  switch (bucket) {
    case '1–2 guests':
      return { lte: 2 }
    case '3–4 guests':
      return { gte: 3, lte: 4 }
    case '5–8 guests':
      return { gte: 5, lte: 8 }
    case '9+ guests':
      return { gte: 9 }
    default:
      return undefined
  }
}

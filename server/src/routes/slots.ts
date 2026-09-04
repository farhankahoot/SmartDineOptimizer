/**
 * Module 3 FE-1/FE-3 — time-slot configuration, with live capacity counted
 * from the reservations that actually hold a table.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { conflict, notFound, parse, route } from '../lib/http.js'
import { requirePermission } from '../middleware/auth.js'

export const slotsRouter = Router()

const view = requirePermission('view:slots')
const manage = requirePermission('manage:slots')

const STATUSES = ['Open', 'Full', 'Almost Full', 'Closed', 'Blocked'] as const
const MEAL_PERIODS = ['Lunch', 'Dinner', 'Late Night', 'Peak Hours', 'Special Occasion'] as const

slotsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        status: z.string().optional(),
        mealPeriod: z.string().optional(),
        day: z.string().optional(),
        /** When given, capacity is computed for this date. */
        date: z.string().optional(),
      }),
      req.query,
    )

    const slots = await prisma.timeSlot.findMany({
      where: {
        ...(q.status && !q.status.startsWith('All') ? { status: q.status } : {}),
        ...(q.mealPeriod && !q.mealPeriod.startsWith('All') ? { mealPeriod: q.mealPeriod } : {}),
        ...(q.day && !q.day.startsWith('All') ? { dayOfWeek: { in: [q.day, 'All'] } } : {}),
      },
      orderBy: { startTime: 'asc' },
    })

    const totalTables = await prisma.restaurantTable.count({
      where: { status: { notIn: ['Blocked', 'Unavailable'] } },
    })

    // Capacity is only meaningful for a specific day.
    const held = q.date
      ? await prisma.reservation.groupBy({
          by: ['timeSlot'],
          where: { date: q.date, activeHold: 'held' },
          _count: { _all: true },
        })
      : []

    const bookedBySlot = new Map(held.map((h) => [h.timeSlot, h._count._all]))

    res.json({
      slots: slots.map((s) => {
        const booked = bookedBySlot.get(s.label) ?? bookedBySlot.get(s.startTime) ?? 0
        return {
          id: s.id,
          slot: s.label,
          start: s.startTime,
          end: s.endTime,
          maxReservations: s.maxReservations,
          mealPeriod: s.mealPeriod,
          dayOfWeek: s.dayOfWeek,
          status: s.status,
          booked: q.date ? booked : null,
          availableTables:
            s.status === 'Blocked' ? null : q.date ? Math.max(0, totalTables - booked) : null,
        }
      }),
    })
  }),
)

const slotSchema = z.object({
  slot: z.string().trim().min(1, 'Enter a label for the slot.'),
  start: z.string().trim().min(1, 'Choose a start time.'),
  end: z.string().trim().min(1, 'Choose an end time.'),
  maxReservations: z.coerce.number().int().min(0).max(500).default(28),
  mealPeriod: z.enum(MEAL_PERIODS).default('Dinner'),
  status: z.enum(STATUSES).default('Open'),
  dayOfWeek: z.string().trim().default('All'),
})

slotsRouter.post(
  '/',
  manage,
  route(async (req, res) => {
    const input = parse(slotSchema, req.body)

    const clash = await prisma.timeSlot.findFirst({
      where: { startTime: input.start, endTime: input.end, dayOfWeek: input.dayOfWeek },
    })
    if (clash) throw conflict('A slot with those times already exists for that day.')

    const created = await prisma.timeSlot.create({
      data: {
        label: input.slot,
        startTime: input.start,
        endTime: input.end,
        maxReservations: input.maxReservations,
        mealPeriod: input.mealPeriod,
        status: input.status,
        dayOfWeek: input.dayOfWeek,
      },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Added time slot', target: created.label, category: 'Slot' })
    res.status(201).json({ slot: created })
  }),
)

slotsRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.timeSlot.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Time slot not found.')

    const input = parse(slotSchema.partial(), req.body)

    // Closing a slot that still holds live bookings would strand those guests.
    if (input.status === 'Blocked' || input.status === 'Closed') {
      const live = await prisma.reservation.count({
        where: { timeSlot: existing.label, activeHold: 'held' },
      })
      if (live > 0) {
        throw conflict(
          `${existing.label} has ${live} live booking${live === 1 ? '' : 's'}. Move or cancel them before closing it.`,
        )
      }
    }

    const updated = await prisma.timeSlot.update({
      where: { id: existing.id },
      data: {
        ...(input.slot ? { label: input.slot } : {}),
        ...(input.start ? { startTime: input.start } : {}),
        ...(input.end ? { endTime: input.end } : {}),
        ...(input.maxReservations !== undefined ? { maxReservations: input.maxReservations } : {}),
        ...(input.mealPeriod ? { mealPeriod: input.mealPeriod } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.dayOfWeek ? { dayOfWeek: input.dayOfWeek } : {}),
      },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated time slot', target: updated.label, category: 'Slot' })
    res.json({ slot: updated })
  }),
)

slotsRouter.delete(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.timeSlot.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Time slot not found.')

    const live = await prisma.reservation.count({
      where: { timeSlot: existing.label, activeHold: 'held' },
    })
    if (live > 0) {
      throw conflict(`${existing.label} has ${live} live booking${live === 1 ? '' : 's'} and cannot be deleted.`)
    }

    await prisma.timeSlot.delete({ where: { id: existing.id } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Deleted time slot', target: existing.label, category: 'Slot' })
    res.json({ ok: true })
  }),
)

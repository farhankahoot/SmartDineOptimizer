/**
 * Module 3 — table records, the floor plan, and the availability checker that
 * enforces one live booking per table, date and slot.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { conflict, notFound, parse, route } from '../lib/http.js'
import { findAvailableTables } from '../lib/reservations.js'
import { requirePermission } from '../middleware/auth.js'

export const tablesRouter = Router()

const view = requirePermission('view:tables')
const manage = requirePermission('manage:tables')

const SECTIONS = ['Main Hall', 'Window Side', 'Outdoor Terrace', 'Private Room'] as const
const TYPES = ['Couple', 'Family', 'Group', 'Private'] as const
const SHAPES = ['round', 'rect', 'square'] as const
const STATUSES = ['Available', 'Reserved', 'Booked', 'Occupied', 'Blocked', 'Unavailable'] as const

tablesRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        section: z.string().optional(),
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
      }),
      req.query,
    )

    const rows = await prisma.restaurantTable.findMany({
      where: {
        ...(q.section && !q.section.startsWith('All') ? { section: q.section } : {}),
        ...(q.status && !q.status.startsWith('All') ? { status: q.status } : {}),
        ...(q.type && !q.type.startsWith('All') ? { type: q.type } : {}),
        ...(q.search ? { code: { contains: q.search.trim() } } : {}),
      },
      orderBy: { code: 'asc' },
    })

    res.json({ tables: rows.map(serializeTable) })
  }),
)

/** Header counters for the Table Management screen. */
tablesRouter.get(
  '/stats',
  view,
  route(async (_req, res) => {
    const [total, available, reserved, blocked, slots] = await Promise.all([
      prisma.restaurantTable.count(),
      prisma.restaurantTable.count({ where: { status: 'Available' } }),
      prisma.restaurantTable.count({ where: { status: { in: ['Reserved', 'Booked', 'Occupied'] } } }),
      prisma.restaurantTable.count({ where: { status: { in: ['Blocked', 'Unavailable'] } } }),
      prisma.timeSlot.count({ where: { status: { in: ['Open', 'Almost Full'] } } }),
    ])

    const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}% of total` : '0% of total')

    res.json({
      total,
      available,
      reserved,
      blocked,
      activeSlots: slots,
      captions: {
        available: pct(available),
        reserved: pct(reserved),
        blocked: pct(blocked),
      },
    })
  }),
)

/** Module 3 FE-4 — availability for a given date and slot. */
tablesRouter.get(
  '/availability',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        date: z.string().min(1),
        timeSlot: z.string().min(1),
        guests: z.coerce.number().int().positive().optional(),
        seating: z.string().optional(),
      }),
      req.query,
    )

    const [all, free, held] = await Promise.all([
      prisma.restaurantTable.findMany({ orderBy: { code: 'asc' } }),
      findAvailableTables(q),
      prisma.reservation.findMany({
        where: { date: q.date, timeSlot: q.timeSlot, activeHold: 'held' },
        select: { tableCode: true, reference: true, customerName: true, guests: true, status: true },
      }),
    ])

    const freeCodes = new Set(free.map((t) => t.code))
    const heldBy = new Map(held.map((h) => [h.tableCode, h]))

    res.json({
      date: q.date,
      timeSlot: q.timeSlot,
      availableCount: free.length,
      totalCount: all.length,
      tables: all.map((t) => ({
        ...serializeTable(t),
        available: freeCodes.has(t.code),
        heldBy: heldBy.get(t.code)
          ? {
              reference: heldBy.get(t.code)!.reference,
              customerName: heldBy.get(t.code)!.customerName,
              guests: heldBy.get(t.code)!.guests,
              status: heldBy.get(t.code)!.status,
            }
          : null,
      })),
    })
  }),
)

const tableSchema = z.object({
  code: z.string().trim().min(1, 'Enter a table number.').max(10),
  seats: z.coerce.number().int().min(1).max(30),
  type: z.enum(TYPES),
  section: z.enum(SECTIONS),
  shape: z.enum(SHAPES).default('rect'),
  status: z.enum(STATUSES).default('Available'),
  x: z.coerce.number().optional(),
  y: z.coerce.number().optional(),
  w: z.coerce.number().optional(),
  h: z.coerce.number().optional(),
})

tablesRouter.post(
  '/',
  manage,
  route(async (req, res) => {
    const input = parse(tableSchema, req.body)
    const code = input.code.toUpperCase()

    const clash = await prisma.restaurantTable.findUnique({ where: { code } })
    if (clash) throw conflict(`Table ${code} already exists.`, { code: 'That table number is taken.' })

    const created = await prisma.restaurantTable.create({ data: { ...input, code } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Added table', target: code, category: 'Table' })
    res.status(201).json({ table: serializeTable(created) })
  }),
)

tablesRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await findTable(req.params.id)
    const input = parse(tableSchema.partial(), req.body)

    if (input.code && input.code.toUpperCase() !== existing.code) {
      const clash = await prisma.restaurantTable.findUnique({ where: { code: input.code.toUpperCase() } })
      if (clash) throw conflict(`Table ${input.code.toUpperCase()} already exists.`)
    }

    // Blocking a table that still holds live bookings would strand those guests.
    if (input.status === 'Blocked' || input.status === 'Unavailable') {
      const live = await prisma.reservation.count({
        where: { tableCode: existing.code, activeHold: 'held' },
      })
      if (live > 0) {
        throw conflict(
          `Table ${existing.code} has ${live} live booking${live === 1 ? '' : 's'}. Move or cancel them before blocking it.`,
        )
      }
    }

    const updated = await prisma.restaurantTable.update({
      where: { id: existing.id },
      data: { ...input, ...(input.code ? { code: input.code.toUpperCase() } : {}) },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated table', target: updated.code, category: 'Table' })
    res.json({ table: serializeTable(updated) })
  }),
)

/** Moves a table on the floor plan. */
tablesRouter.patch(
  '/:id/position',
  manage,
  route(async (req, res) => {
    const existing = await findTable(req.params.id)
    const input = parse(
      z.object({
        x: z.coerce.number().min(0).max(100),
        y: z.coerce.number().min(0).max(200),
        w: z.coerce.number().min(3).max(60).optional(),
        h: z.coerce.number().min(3).max(60).optional(),
      }),
      req.body,
    )

    const updated = await prisma.restaurantTable.update({ where: { id: existing.id }, data: input })
    res.json({ table: serializeTable(updated) })
  }),
)

tablesRouter.delete(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await findTable(req.params.id)

    const live = await prisma.reservation.count({
      where: { tableCode: existing.code, activeHold: 'held' },
    })
    if (live > 0) {
      throw conflict(
        `Table ${existing.code} has ${live} live booking${live === 1 ? '' : 's'} and cannot be deleted.`,
      )
    }

    await prisma.restaurantTable.delete({ where: { id: existing.id } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Deleted table', target: existing.code, category: 'Table' })
    res.json({ ok: true })
  }),
)

async function findTable(id: string) {
  const table = await prisma.restaurantTable.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
  })
  if (!table) throw notFound('Table not found.')
  return table
}

export function serializeTable(t: {
  id: string
  code: string
  seats: number
  type: string
  section: string
  shape: string
  status: string
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    id: t.code,
    recordId: t.id,
    seats: t.seats,
    type: t.type,
    section: t.section,
    shape: t.shape,
    status: t.status,
    x: t.x,
    y: t.y,
    w: t.w,
    h: t.h,
  }
}

/**
 * Module 4 FE-1/FE-2/FE-3 — occasion-based food deals and the customer
 * special-request queue.
 *
 * LI-3: the proposal excludes online payment, so a deal is a menu package with
 * a price, not a checkout item.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { conflict, notFound, parse, route } from '../lib/http.js'
import { requirePermission } from '../middleware/auth.js'

export const dealsRouter = Router()

const view = requirePermission('view:deals')
const manage = requirePermission('manage:deals')

/** Prices are stored in paisa and exposed in rupees. */
const toRupees = (minor: number) => minor / 100
const toMinor = (rupees: number) => Math.round(rupees * 100)

dealsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        category: z.string().optional(),
        occasion: z.string().optional(),
        active: z.enum(['true', 'false']).optional(),
        search: z.string().optional(),
      }),
      req.query,
    )

    const rows = await prisma.deal.findMany({
      where: {
        ...(q.category && !q.category.startsWith('All') ? { category: q.category } : {}),
        ...(q.occasion && !q.occasion.startsWith('All') ? { occasion: q.occasion } : {}),
        ...(q.active ? { active: q.active === 'true' } : {}),
        ...(q.search ? { name: { contains: q.search.trim() } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ deals: rows.map(serializeDeal) })
  }),
)

/** Header counters for the Food Deals screen. */
dealsRouter.get(
  '/stats',
  view,
  route(async (_req, res) => {
    const [active, birthday, family, pendingRequests] = await Promise.all([
      prisma.deal.count({ where: { active: true } }),
      prisma.reservation.count({ where: { occasion: 'Birthday' } }),
      prisma.reservation.count({ where: { occasion: { in: ['Family Dinner', 'Family Lunch'] } } }),
      prisma.specialRequest.count({ where: { status: 'Pending' } }),
    ])

    res.json({ active, birthdayBookings: birthday, familyBookings: family, pendingRequests })
  }),
)

/**
 * Deal performance.
 *
 * A reservation records its occasion, not the deal a guest chose — there is no
 * deal_id on the booking — so "how often was this deal selected" is not
 * answerable from the data. What *is* answerable is how many bookings match
 * each deal's occasion, and that is what this returns, labelled as such.
 */
dealsRouter.get(
  '/performance',
  view,
  route(async (_req, res) => {
    const [deals, byOccasion] = await Promise.all([
      prisma.deal.findMany({ orderBy: { name: 'asc' } }),
      prisma.reservation.groupBy({ by: ['occasion'], _count: { _all: true } }),
    ])

    const counts = new Map(byOccasion.map((o) => [o.occasion, o._count._all]))
    const ranked = deals
      .map((d) => ({
        id: d.id,
        name: d.name,
        occasion: d.occasion,
        active: d.active,
        price: toRupees(d.priceMinor),
        matchingBookings: counts.get(d.occasion) ?? 0,
      }))
      .sort((a, b) => b.matchingBookings - a.matchingBookings)

    const totalMatched = ranked.reduce((n, d) => n + d.matchingBookings, 0)
    const totalReservations = byOccasion.reduce((n, o) => n + o._count._all, 0)

    res.json({
      basis: 'Bookings whose occasion matches the deal. Deal selection is not recorded per booking.',
      ranked,
      top: ranked[0] ?? null,
      lowest: ranked.length ? ranked[ranked.length - 1] : null,
      totalMatched,
      /** Share of bookings that fall on an occasion a deal covers. */
      coveragePct: totalReservations
        ? Number(((totalMatched / totalReservations) * 100).toFixed(1))
        : 0,
    })
  }),
)

const dealSchema = z.object({
  name: z.string().trim().min(2, 'Enter a deal name.').max(80),
  category: z.string().trim().min(2, 'Choose a category.'),
  occasion: z.string().trim().min(2, 'Choose an occasion.'),
  price: z.coerce.number().min(0, 'Enter a price.').max(10_000_000),
  items: z.string().trim().min(2, 'List what the deal includes.').max(400),
  active: z.boolean().default(true),
})

dealsRouter.post(
  '/',
  manage,
  route(async (req, res) => {
    const input = parse(dealSchema, req.body)

    const clash = await prisma.deal.findUnique({ where: { name: input.name } })
    if (clash) throw conflict('A deal with that name already exists.', { name: 'That name is taken.' })

    const created = await prisma.deal.create({
      data: {
        name: input.name,
        category: input.category,
        occasion: input.occasion,
        priceMinor: toMinor(input.price),
        items: input.items,
        active: input.active,
      },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Created deal', target: created.name, category: 'Deal' })
    res.status(201).json({ deal: serializeDeal(created) })
  }),
)

dealsRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Deal not found.')

    const input = parse(dealSchema.partial(), req.body)

    const updated = await prisma.deal.update({
      where: { id: existing.id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.occasion ? { occasion: input.occasion } : {}),
        ...(input.price !== undefined ? { priceMinor: toMinor(input.price) } : {}),
        ...(input.items ? { items: input.items } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated deal', target: updated.name, category: 'Deal' })
    res.json({ deal: serializeDeal(updated) })
  }),
)

dealsRouter.delete(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Deal not found.')

    await prisma.deal.delete({ where: { id: existing.id } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Deleted deal', target: existing.name, category: 'Deal' })
    res.json({ ok: true })
  }),
)

/* -------------------------------------------------- customer special requests */

export const requestsRouter = Router()

requestsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({ status: z.string().optional(), search: z.string().optional() }),
      req.query,
    )

    const rows = await prisma.specialRequest.findMany({
      where: {
        ...(q.status && !q.status.startsWith('All') ? { status: q.status } : {}),
        ...(q.search
          ? {
              OR: [
                { customerName: { contains: q.search.trim() } },
                { reference: { contains: q.search.trim() } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      requests: rows.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        reservationId: r.reference,
        date: r.date,
        timeSlot: r.timeSlot,
        table: r.tableCode,
        occasion: r.occasion,
        request: r.request,
        status: r.status,
        createdAt: r.createdAt,
      })),
    })
  }),
)

requestsRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const { status } = parse(
      z.object({ status: z.enum(['Pending', 'In Progress', 'Accepted', 'Completed', 'Rejected']) }),
      req.body,
    )

    const existing = await prisma.specialRequest.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Special request not found.')

    const updated = await prisma.specialRequest.update({
      where: { id: existing.id },
      data: { status },
    })

    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: `Marked special request ${status.toLowerCase()}`,
      target: existing.reference,
      category: 'Reservation',
    })

    res.json({ request: updated })
  }),
)

/** Alert strip on the Food Deals screen, counted from the live queue. */
requestsRouter.get(
  '/alerts',
  view,
  route(async (_req, res) => {
    const open = { status: { in: ['Pending', 'In Progress'] } }
    const [birthday, allergy, privateTable] = await Promise.all([
      prisma.specialRequest.count({ where: { ...open, occasion: 'Birthday' } }),
      prisma.specialRequest.count({ where: { ...open, request: { contains: 'llerg' } } }),
      prisma.specialRequest.count({ where: { ...open, request: { contains: 'rivate' } } }),
    ])

    res.json({
      alerts: [
        { id: 'A1', count: birthday, text: 'Birthday setup requests pending', icon: 'cake', color: '#C0392B' },
        { id: 'A2', count: allergy, text: 'Allergy-related requests need attention', icon: 'alert', color: '#D9932B' },
        { id: 'A3', count: privateTable, text: 'Private table requests open', icon: 'table', color: '#2F6FD0' },
      ],
    })
  }),
)

function serializeDeal(d: {
  id: string
  name: string
  category: string
  occasion: string
  priceMinor: number
  items: string
  active: boolean
}) {
  const rupees = toRupees(d.priceMinor)
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    occasion: d.occasion,
    price: rupees,
    // Paisa are only shown when they are non-zero, so whole-rupee deals stay
    // clean while a fractional price never renders as "₨1,234.5".
    priceLabel: `₨${rupees.toLocaleString('en-PK', {
      minimumFractionDigits: d.priceMinor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`,
    items: d.items,
    active: d.active,
  }
}

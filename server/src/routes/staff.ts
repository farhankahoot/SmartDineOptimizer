/**
 * Module 4 FE-4/FE-5/FE-6 — staff records, shift availability, and the
 * allocation plan that compares the roster against predicted demand.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { conflict, notFound, parse, route } from '../lib/http.js'
import { getSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'

export const staffRouter = Router()

const view = requirePermission('view:staff')
const manage = requirePermission('manage:staff')

const ROLES = ['Chef', 'Serving Staff', 'Cleaning Staff', 'Service Staff'] as const
const SHIFTS = ['Morning', 'Evening', 'Night'] as const
const AVAILABILITY = ['Available', 'On Shift', 'Off Duty', 'On Leave'] as const

export const shiftHours: Record<string, string> = {
  Morning: '7:00 AM – 3:00 PM',
  Evening: '3:00 PM – 11:00 PM',
  Night: '11:00 PM – 7:00 AM',
}

staffRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        role: z.string().optional(),
        shift: z.string().optional(),
        availability: z.string().optional(),
        search: z.string().optional(),
      }),
      req.query,
    )

    const rows = await prisma.staffMember.findMany({
      where: {
        ...(q.role && !q.role.startsWith('All') ? { role: q.role } : {}),
        ...(q.shift && !q.shift.startsWith('All') ? { shift: q.shift } : {}),
        ...(q.availability && !q.availability.startsWith('All') ? { availability: q.availability } : {}),
        ...(q.search
          ? { OR: [{ name: { contains: q.search.trim() } }, { code: { contains: q.search.trim() } }] }
          : {}),
      },
      orderBy: { code: 'asc' },
    })

    res.json({ staff: rows.map(serializeStaff) })
  }),
)

/**
 * Module 4 FE-6 — required head-count per shift against the roster.
 *
 * The requirement is derived from bookings held in each shift's slots and the
 * guests-per-server / guests-per-chef ratios the restaurant sets, so the plan
 * follows real demand rather than a fixed table.
 */
staffRouter.get(
  '/allocation',
  view,
  route(async (req, res) => {
    const { date } = parse(z.object({ date: z.string().optional() }), req.query)

    const settings = await getSetting('prediction.settings')
    const roster = await prisma.staffMember.groupBy({
      by: ['shift', 'role'],
      _count: { _all: true },
      where: { availability: { in: ['Available', 'On Shift'] } },
    })

    const bookings = await prisma.reservation.findMany({
      where: { activeHold: 'held', ...(date ? { date } : {}) },
      select: { timeSlot: true, guests: true },
    })

    const demand = new Map(SHIFTS.map((s) => [s as string, { guests: 0, reservations: 0 }]))
    for (const b of bookings) {
      const shift = shiftForTime(b.timeSlot)
      const bucket = demand.get(shift)!
      bucket.guests += b.guests
      bucket.reservations += 1
    }

    const rosterFor = (shift: string, role: string) =>
      roster.find((r) => r.shift === shift && r.role === role)?._count._all ?? 0

    res.json({
      basis: date ? `Bookings held on ${date}` : 'All live bookings',
      ratios: {
        guestsPerServer: settings.guestsPerServer,
        guestsPerChef: settings.guestsPerChef,
      },
      shifts: SHIFTS.map((shift) => {
        const d = demand.get(shift)!
        const requiredChefs = d.guests ? Math.max(1, Math.ceil(d.guests / settings.guestsPerChef)) : 0
        const requiredServing = d.guests ? Math.max(1, Math.ceil(d.guests / settings.guestsPerServer)) : 0
        const requiredCleaning = d.guests ? Math.max(1, Math.ceil(d.guests / 90)) : 0

        return {
          shift,
          hours: shiftHours[shift],
          expectedGuests: d.guests,
          reservations: d.reservations,
          requiredChefs,
          requiredServing,
          requiredCleaning,
          rosteredChefs: rosterFor(shift, 'Chef'),
          rosteredServing: rosterFor(shift, 'Serving Staff'),
          rosteredCleaning: rosterFor(shift, 'Cleaning Staff'),
          chefGap: rosterFor(shift, 'Chef') - requiredChefs,
          servingGap: rosterFor(shift, 'Serving Staff') - requiredServing,
          cleaningGap: rosterFor(shift, 'Cleaning Staff') - requiredCleaning,
        }
      }),
    })
  }),
)

staffRouter.get(
  '/stats',
  view,
  route(async (_req, res) => {
    const [total, byRole, byShift, onLeave] = await Promise.all([
      prisma.staffMember.count(),
      prisma.staffMember.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.staffMember.groupBy({ by: ['shift'], _count: { _all: true } }),
      prisma.staffMember.count({ where: { availability: 'On Leave' } }),
    ])

    res.json({
      total,
      onLeave,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])),
      byShift: Object.fromEntries(byShift.map((r) => [r.shift, r._count._all])),
    })
  }),
)

const staffSchema = z.object({
  code: z.string().trim().max(12).optional(),
  name: z.string().trim().min(2, 'Enter the staff member’s name.').max(80),
  role: z.enum(ROLES),
  phone: z.string().trim().min(7, 'Enter a contact number.'),
  shift: z.enum(SHIFTS),
  availability: z.enum(AVAILABILITY).default('Available'),
  joinedOn: z.string().trim().min(1).default(() => formatToday()),
})

staffRouter.post(
  '/',
  manage,
  route(async (req, res) => {
    const input = parse(staffSchema, req.body)
    const code = input.code?.toUpperCase() || (await nextStaffCode())

    const clash = await prisma.staffMember.findUnique({ where: { code } })
    if (clash) throw conflict(`Staff code ${code} is already in use.`)

    const created = await prisma.staffMember.create({ data: { ...input, code } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Added staff member', target: created.name, category: 'Staff' })
    res.status(201).json({ staff: serializeStaff(created) })
  }),
)

staffRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.staffMember.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id.toUpperCase() }] },
    })
    if (!existing) throw notFound('Staff member not found.')

    const input = parse(staffSchema.partial(), req.body)
    const updated = await prisma.staffMember.update({
      where: { id: existing.id },
      data: { ...input, ...(input.code ? { code: input.code.toUpperCase() } : {}) },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated staff member', target: updated.name, category: 'Staff' })
    res.json({ staff: serializeStaff(updated) })
  }),
)

staffRouter.delete(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.staffMember.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id.toUpperCase() }] },
    })
    if (!existing) throw notFound('Staff member not found.')

    await prisma.staffMember.delete({ where: { id: existing.id } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Removed staff member', target: existing.name, category: 'Staff' })
    res.json({ ok: true })
  }),
)

/* --------------------------------------------------------------- helpers */

/** Maps a booking time onto the shift that will serve it. */
function shiftForTime(timeSlot: string): string {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(timeSlot)
  if (!m) return 'Evening'
  let hour = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'PM') hour += 12
  if (hour >= 7 && hour < 15) return 'Morning'
  if (hour >= 15 && hour < 23) return 'Evening'
  return 'Night'
}

async function nextStaffCode(): Promise<string> {
  const last = await prisma.staffMember.findFirst({ orderBy: { code: 'desc' }, select: { code: true } })
  const n = last ? Number(last.code.replace(/\D/g, '')) : 0
  return `ST-${String((Number.isFinite(n) ? n : 0) + 1).padStart(2, '0')}`
}

function formatToday(): string {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function serializeStaff(s: {
  id: string
  code: string
  name: string
  role: string
  phone: string
  shift: string
  availability: string
  joinedOn: string
}) {
  return {
    id: s.code,
    recordId: s.id,
    name: s.name,
    role: s.role,
    phone: s.phone,
    shift: s.shift,
    shiftHours: shiftHours[s.shift] ?? '',
    availability: s.availability,
    joined: s.joinedOn,
  }
}

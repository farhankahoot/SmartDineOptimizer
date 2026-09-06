/**
 * Module 1 — the guest-facing surface. No authentication, and deliberately
 * narrow: booking, tracking, and the read-only data the landing page needs.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit, notifyAdmins } from '../lib/audit.js'
import { forbidden, notFound, parse, route } from '../lib/http.js'
import { sendReservationMessage } from '../lib/mailer.js'
import {
  assertRules,
  assertTableFree,
  assignTable,
  canTransition,
  findAvailableTables,
  holdFor,
  nextReference,
  serialize,
} from '../lib/reservations.js'
import { getSetting, getSystem } from '../lib/settings.js'

export const publicRouter = Router()

/** Everything the landing page and booking form need in one round trip. */
publicRouter.get(
  '/config',
  route(async (_req, res) => {
    const [system, landing, rules, profile, hours, slots, deals, showcase, flags] =
      await Promise.all([
        getSystem(),
        getSetting('landing.content'),
        getSetting('reservation.rules'),
        getSetting('restaurant.profile'),
        getSetting('restaurant.hours'),
        prisma.timeSlot.findMany({ where: { status: { notIn: ['Closed', 'Blocked'] } }, orderBy: { startTime: 'asc' } }),
        prisma.deal.findMany({ where: { active: true }, orderBy: { priceMinor: 'asc' } }),
        prisma.showcaseRestaurant.findMany({ where: { status: 'Active' }, orderBy: { sortOrder: 'asc' } }),
        prisma.featureFlag.findMany(),
      ])

    res.json({
      system: {
        maintenanceMode: system.maintenanceMode,
        maintenanceMessage: system.maintenanceMessage,
        maintenanceEta: system.maintenanceEta,
        publicBookingEnabled: system.publicBookingEnabled,
        trackingEnabled: system.trackingEnabled,
        registrationEnabled: system.registrationEnabled,
        restaurantSubmissionsEnabled: system.restaurantSubmissionsEnabled,
      },
      landing,
      profile,
      hours,
      rules: {
        minPartySize: rules.minPartySize,
        maxPartySize: rules.maxPartySize,
        advanceDays: rules.advanceDays,
        allowSameDay: rules.allowSameDay,
        requireApproval: rules.requireApproval,
      },
      timeSlots: slots.map((s) => ({
        id: s.id,
        label: s.label,
        start: s.startTime,
        end: s.endTime,
        status: s.status,
        mealPeriod: s.mealPeriod,
      })),
      deals: deals.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        occasion: d.occasion,
        price: d.priceMinor / 100,
        items: d.items,
      })),
      showcase: showcase.map(serializeShowcase),
      features: Object.fromEntries(flags.map((f) => [f.key, f.enabled])),
    })
  }),
)

/** Which tables are free — drives the guest floor plan (Module 3 FE-4). */
publicRouter.get(
  '/availability',
  route(async (req, res) => {
    const { date, timeSlot, guests } = parse(
      z.object({
        date: z.string().min(1),
        timeSlot: z.string().min(1),
        guests: z.coerce.number().int().positive().optional(),
      }),
      req.query,
    )

    const [all, free] = await Promise.all([
      prisma.restaurantTable.findMany({ orderBy: { code: 'asc' } }),
      findAvailableTables({ date, timeSlot, guests }),
    ])

    const freeCodes = new Set(free.map((t) => t.code))

    res.json({
      date,
      timeSlot,
      availableCount: free.length,
      tables: all.map((t) => ({
        id: t.code,
        seats: t.seats,
        type: t.type,
        section: t.section,
        shape: t.shape,
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
        status:
          t.status === 'Blocked' || t.status === 'Unavailable'
            ? 'Unavailable'
            : freeCodes.has(t.code)
              ? 'Available'
              : 'Reserved',
      })),
    })
  }),
)

const bookingSchema = z.object({
  customerName: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().trim().min(7, 'Enter a contact number.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  date: z.string().trim().min(1, 'Choose a date.'),
  timeSlot: z.string().trim().min(1, 'Choose a time slot.'),
  guests: z.coerce.number().int().positive('Enter the number of guests.'),
  occasion: z.string().trim().min(1).default('Other'),
  seating: z.string().trim().default('No preference'),
  table: z.string().trim().optional(),
  specialRequest: z.string().trim().max(500).default(''),
})

/** Module 1 FE-4/FE-5 — submit a booking request. */
publicRouter.post(
  '/reservations',
  route(async (req, res) => {
    const system = await getSystem()
    if (system.maintenanceMode) {
      throw forbidden(system.maintenanceMessage || 'Online booking is temporarily unavailable.')
    }
    if (!system.publicBookingEnabled) {
      throw forbidden('Online booking is closed right now. Please call the restaurant.')
    }

    const input = parse(bookingSchema, req.body)
    await assertRules(input)

    const rules = await getSetting('reservation.rules')

    // A guest-picked table is honoured if it is genuinely free; otherwise the
    // system assigns the smallest table that fits.
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

    // Module 2 FE-1 — requests wait for admin approval unless the restaurant
    // has turned that requirement off.
    const status = rules.requireApproval ? 'Pending' : 'Confirmed'
    const reference = await nextReference()

    const created = await prisma.reservation.create({
      data: {
        reference,
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
        source: 'Website Booking',
        status,
        activeHold: holdFor(status),
        events: {
          create: [
            { status: 'Submitted', note: 'Reservation request received.', actorName: 'Customer' },
            ...(status === 'Confirmed'
              ? [{ status: 'Confirmed', note: 'Auto-confirmed by reservation rules.', actorName: 'System' }]
              : []),
          ],
        },
      },
      include: { events: { orderBy: { at: 'asc' } } },
    })

    // A special request becomes a work item for the kitchen (Module 4 FE-2).
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

    if (status === 'Confirmed') await sendReservationMessage(created, 'Confirmation')

    await audit({
      actorName: created.customerName,
      action: 'Submitted reservation',
      target: created.reference,
      category: 'Reservation',
    })
    await notifyAdmins({
      tone: status === 'Pending' ? 'warning' : 'info',
      title: status === 'Pending' ? 'New reservation awaiting approval' : 'New reservation confirmed',
      detail: `${created.customerName} · ${created.guests} guests · ${created.date} at ${created.timeSlot} · Table ${created.tableCode}`,
      link: '/admin/reservations',
    })

    res.status(201).json({ reservation: serialize(created) })
  }),
)

/** Module 1 FE-7 — the guest status tracker. */
publicRouter.get(
  '/reservations/:reference',
  route(async (req, res) => {
    const system = await getSystem()
    if (!system.trackingEnabled) throw forbidden('Booking lookup is turned off right now.')

    const reservation = await prisma.reservation.findUnique({
      where: { reference: req.params.reference.trim().toUpperCase() },
      include: { events: { orderBy: { at: 'asc' } } },
    })

    if (!reservation) throw notFound('No booking found with that reference.')

    const full = serialize(reservation)

    // The tracker is unauthenticated, so contact details are masked. Anyone
    // holding the reference can see the booking's state, not the guest's data.
    res.json({
      reservation: {
        ...full,
        phone: maskPhone(full.phone),
        email: maskEmail(full.email),
        allowedTransitions: undefined,
      },
    })
  }),
)

/** A guest may cancel their own booking with the reference plus their email. */
publicRouter.post(
  '/reservations/:reference/cancel',
  route(async (req, res) => {
    const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email() }), req.body)

    const reservation = await prisma.reservation.findUnique({
      where: { reference: req.params.reference.trim().toUpperCase() },
    })
    if (!reservation) throw notFound('No booking found with that reference.')

    // Reference alone is not enough to cancel — the email must match.
    if (reservation.email.toLowerCase() !== email) {
      throw notFound('No booking found with that reference and email address.')
    }
    if (!canTransition(reservation.status, 'Cancelled')) {
      throw forbidden(`A ${reservation.status.toLowerCase()} booking cannot be cancelled.`)
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'Cancelled',
        activeHold: null,
        events: {
          create: {
            status: 'Cancelled',
            note: 'Cancelled by the guest from the booking tracker.',
            actorName: reservation.customerName,
          },
        },
      },
      include: { events: { orderBy: { at: 'asc' } } },
    })

    await sendReservationMessage(updated, 'Cancellation')
    await audit({ actorName: reservation.customerName, action: 'Cancelled reservation', target: reservation.reference, category: 'Reservation' })
    await notifyAdmins({
      tone: 'info',
      title: 'Guest cancelled a booking',
      detail: `${reservation.customerName} cancelled ${reservation.reference} for ${reservation.date}.`,
      link: '/admin/reservations',
    })

    res.json({ reservation: serialize(updated) })
  }),
)

/**
 * Guest feedback.
 *
 * Public and unauthenticated, so it is rate limited alongside the other public
 * writes and every field is bounded. Stored as a record and raised as a
 * control-centre notification, so it survives the notification being read.
 */
publicRouter.post(
  '/feedback',
  route(async (req, res) => {
    const input = parse(
      z.object({
        name: z.string().trim().min(2, 'Please tell us your name.').max(80),
        // Optional: absent and empty are both fine, but a value must be valid.
        email: z
          .string()
          .trim()
          .toLowerCase()
          .email('Enter a valid email address.')
          .or(z.literal(''))
          .optional()
          .default(''),
        reference: z.string().trim().max(20).optional(),
        rating: z.coerce.number().int().min(1, 'Choose a rating.').max(5),
        topic: z.enum(['Food', 'Service', 'Booking', 'Ambience', 'Other']),
        message: z.string().trim().min(10, 'Tell us a little more.').max(1000),
      }),
      req.body,
    )

    const saved = await prisma.feedback.create({
      data: {
        name: input.name,
        email: input.email,
        reference: input.reference?.toUpperCase() ?? '',
        rating: input.rating,
        topic: input.topic,
        message: input.message,
      },
    })

    await notifyAdmins({
      // A poor rating is something the restaurant should see today.
      tone: input.rating <= 2 ? 'danger' : input.rating >= 4 ? 'success' : 'warning',
      title: `${input.rating}/5 — ${input.topic.toLowerCase()} feedback from ${input.name}`,
      detail: input.message.slice(0, 240),
      link: '/superadmin/notifications',
    })

    await audit({
      actorName: input.name,
      action: `Left ${input.rating}/5 feedback`,
      target: input.topic,
      category: 'Reservation',
    })

    res.status(201).json({ ok: true, id: saved.id })
  }),
)

/** Public showcase carousel (Module: platform content). */
publicRouter.get(
  '/showcase',
  route(async (_req, res) => {
    const rows = await prisma.showcaseRestaurant.findMany({
      where: { status: 'Active' },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    })
    res.json({ restaurants: rows.map(serializeShowcase) })
  }),
)

/**
 * A restaurant can submit itself to the directory. Submissions land as
 * "Pending" and never appear publicly until a super admin approves them.
 */
publicRouter.post(
  '/showcase/submit',
  route(async (req, res) => {
    const system = await getSystem()
    if (!system.restaurantSubmissionsEnabled) {
      throw forbidden('Restaurant submissions are closed right now.')
    }

    const input = parse(
      z.object({
        name: z.string().trim().min(2),
        city: z.string().trim().min(2),
        province: z.string().trim().min(2),
        cuisine: z.string().trim().min(2),
        description: z.string().trim().min(10).max(400),
        website: z.string().trim().url().optional().or(z.literal('')),
      }),
      req.body,
    )

    const created = await prisma.showcaseRestaurant.create({
      data: {
        name: input.name,
        city: input.city,
        province: input.province,
        cuisine: input.cuisine,
        description: input.description,
        website: input.website || null,
        status: 'Pending',
        sortOrder: 999,
      },
    })

    await notifyAdmins({
      tone: 'warning',
      title: 'Restaurant awaiting approval',
      detail: `${created.name} (${created.city}) was submitted to the showcase and is pending review.`,
      link: '/superadmin/restaurants',
    })
    await audit({ actorName: created.name, action: 'Submitted restaurant to showcase', target: created.name, category: 'Restaurant' })

    res.status(201).json({ ok: true, status: 'Pending' })
  }),
)

/* ------------------------------------------------------------- helpers */

export function serializeShowcase(r: {
  id: string
  name: string
  city: string
  province: string
  cuisine: string
  description: string
  imageUrl: string | null
  coverFrom: string
  coverTo: string
  website: string | null
  featured: boolean
  status: string
  sortOrder: number
  createdAt: Date
}) {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    province: r.province,
    cuisine: r.cuisine,
    description: r.description,
    image: r.imageUrl ?? undefined,
    cover: [r.coverFrom, r.coverTo] as [string, string],
    website: r.website ?? undefined,
    featured: r.featured,
    status: r.status,
    order: r.sortOrder,
    addedOn: r.createdAt,
  }
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '•••'
  return `${'•'.repeat(Math.max(3, digits.length - 3))}${digits.slice(-3)}`
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return '•••'
  const head = name.slice(0, 2)
  return `${head}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`
}

/**
 * Module 6 — the operations dashboard. Every number here is aggregated from
 * the database rather than read from a constant, so the screen moves when the
 * data does.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { parse, route } from '../lib/http.js'
import { getSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'

export const dashboardRouter = Router()

const view = requirePermission('view:dashboard')

dashboardRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const { period } = parse(
      z.object({ period: z.enum(['Today', 'Last 7 days', 'Last 30 days']).default('Last 7 days') }),
      req.query,
    )

    const days = period === 'Today' ? 1 : period === 'Last 7 days' ? 7 : 30

    const metrics = await prisma.dailyMetric.findMany({ orderBy: { date: 'desc' }, take: days * 2 })
    const window = metrics.slice(0, days)
    const previous = metrics.slice(days, days * 2)

    const sum = (rows: typeof metrics, key: keyof (typeof metrics)[number]) =>
      rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)

    const [tableCounts, statusCounts, guestsHeld] = await Promise.all([
      prisma.restaurantTable.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.reservation.aggregate({ _sum: { guests: true }, where: { activeHold: 'held' } }),
    ])

    const tableCount = (statuses: string[]) =>
      tableCounts.filter((t) => statuses.includes(t.status)).reduce((n, t) => n + t._count._all, 0)

    const statusCount = (status: string) =>
      statusCounts.find((s) => s.status === status)?._count._all ?? 0

    const delta = (now: number, before: number) =>
      before === 0 ? null : Number((((now - before) / before) * 100).toFixed(1))

    const reservationsNow = sum(window, 'reservations')
    const confirmedNow = sum(window, 'confirmed')
    const cancelledNow = sum(window, 'cancelled')

    res.json({
      period,
      kpis: {
        totalReservations: reservationsNow,
        totalReservationsDelta: delta(reservationsNow, sum(previous, 'reservations')),
        confirmed: confirmedNow,
        confirmedDelta: delta(confirmedNow, sum(previous, 'confirmed')),
        cancelled: cancelledNow,
        cancelledDelta: delta(cancelledNow, sum(previous, 'cancelled')),
        availableTables: tableCount(['Available']),
        bookedTables: tableCount(['Reserved', 'Booked', 'Occupied']),
        blockedTables: tableCount(['Blocked', 'Unavailable']),
        guestsHeld: guestsHeld._sum.guests ?? 0,
        revenue: sum(window, 'revenueMinor') / 100,
        revenueDelta: delta(sum(window, 'revenueMinor'), sum(previous, 'revenueMinor')),
      },
      /** Module 6 FE-1 — reservation mix. */
      mix: [
        { name: 'Confirmed', value: statusCount('Confirmed'), color: '#125E2E' },
        { name: 'Pending', value: statusCount('Pending'), color: '#C2761C' },
        { name: 'Completed', value: statusCount('Completed'), color: '#2563EB' },
        { name: 'Cancelled', value: statusCount('Cancelled') + statusCount('Rejected'), color: '#C0392B' },
      ],
      /** Module 6 FE-3 — revenue trend with the forecast line. */
      revenueTrend: [...window].reverse().map((m) => ({
        day: shortDay(m.date),
        date: m.date,
        actual: m.revenueMinor / 100,
        forecast: m.forecastRevenueMinor / 100,
      })),
    })
  }),
)

/** Module 6 FE-2 — footfall by time slot, from live bookings. */
dashboardRouter.get(
  '/footfall',
  view,
  route(async (req, res) => {
    const { date } = parse(z.object({ date: z.string().optional() }), req.query)

    const rows = await prisma.reservation.groupBy({
      by: ['timeSlot'],
      where: { activeHold: 'held', ...(date ? { date } : {}) },
      _sum: { guests: true },
      _count: { _all: true },
    })

    res.json({
      date: date ?? 'all live bookings',
      footfall: rows
        .map((r) => ({
          slot: r.timeSlot,
          guests: r._sum.guests ?? 0,
          reservations: r._count._all,
          minutes: toMinutes(r.timeSlot),
        }))
        .sort((a, b) => a.minutes - b.minutes)
        .map(({ minutes, ...rest }) => {
          void minutes
          return rest
        }),
    })
  }),
)

/** Module 6 FE-4 — peak-hour load per configured slot. */
dashboardRouter.get(
  '/peak-hours',
  view,
  route(async (req, res) => {
    const { date } = parse(z.object({ date: z.string().optional() }), req.query)

    const [slots, capacity, held] = await Promise.all([
      prisma.timeSlot.findMany({ where: { status: { not: 'Blocked' } }, orderBy: { startTime: 'asc' } }),
      prisma.restaurantTable.count({ where: { status: { notIn: ['Blocked', 'Unavailable'] } } }),
      prisma.reservation.groupBy({
        by: ['timeSlot'],
        where: { activeHold: 'held', ...(date ? { date } : {}) },
        _count: { _all: true },
      }),
    ])

    const bookedBySlot = new Map(held.map((h) => [h.timeSlot, h._count._all]))

    res.json({
      peakHours: slots.map((s) => {
        // A slot's bookings can be labelled by the slot's full range or by a
        // single time inside it, so both are counted.
        const booked =
          (bookedBySlot.get(s.label) ?? 0) +
          [...bookedBySlot.entries()]
            .filter(([label]) => label !== s.label && timeFallsInSlot(label, s.startTime, s.endTime))
            .reduce((n, [, count]) => n + count, 0)

        const ceiling = Math.min(capacity, s.maxReservations || capacity)
        const load = ceiling ? Math.min(100, Math.round((booked / ceiling) * 100)) : 0

        return {
          slot: s.label,
          booked,
          capacity: ceiling,
          load,
          tone: load >= 90 ? 'danger' : load >= 70 ? 'warn' : 'ok',
          label: load >= 90 ? 'Peak' : load >= 70 ? 'Filling up' : load >= 40 ? 'Steady' : 'Quiet',
        }
      }),
    })
  }),
)

/**
 * Module 6 FE-5/FE-6/FE-8 — the alert feed and recommendations.
 *
 * These are derived conditions, not a fixed list: an alert appears because a
 * threshold in the data was crossed.
 */
dashboardRouter.get(
  '/alerts',
  view,
  route(async (_req, res) => {
    const [slots, capacity, held, pending, blockedTables, openRequests, prediction, settings] =
      await Promise.all([
        prisma.timeSlot.findMany({ where: { status: { not: 'Blocked' } } }),
        prisma.restaurantTable.count({ where: { status: { notIn: ['Blocked', 'Unavailable'] } } }),
        prisma.reservation.groupBy({ by: ['timeSlot'], where: { activeHold: 'held' }, _count: { _all: true } }),
        prisma.reservation.findMany({
          where: { status: 'Pending' },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
        prisma.restaurantTable.findMany({ where: { status: 'Blocked' }, select: { code: true } }),
        prisma.specialRequest.count({ where: { status: { in: ['Pending', 'In Progress'] } } }),
        prisma.predictionOutput.findFirst({ where: { kind: 'staffing' }, orderBy: { generatedAt: 'desc' } }),
        getSetting('prediction.settings'),
      ])

    const bookedBySlot = new Map(held.map((h) => [h.timeSlot, h._count._all]))
    const alerts: {
      id: string
      tone: 'danger' | 'warn' | 'info' | 'success'
      category: string
      title: string
      detail: string
    }[] = []

    for (const s of slots) {
      const booked =
        (bookedBySlot.get(s.label) ?? 0) +
        [...bookedBySlot.entries()]
          .filter(([label]) => label !== s.label && timeFallsInSlot(label, s.startTime, s.endTime))
          .reduce((n, [, count]) => n + count, 0)

      const ceiling = Math.min(capacity, s.maxReservations || capacity)
      if (!ceiling) continue
      const load = Math.round((booked / ceiling) * 100)

      if (load >= 90) {
        alerts.push({
          id: `peak-${s.id}`,
          tone: 'danger',
          category: 'Peak hour',
          title: `${s.label} is ${load}% booked`,
          detail: `${Math.max(0, ceiling - booked)} table(s) left. Consider opening the private room.`,
        })
      } else if (load >= 70) {
        alerts.push({
          id: `filling-${s.id}`,
          tone: 'warn',
          category: 'Peak hour',
          title: `${s.label} is filling up (${load}%)`,
          detail: `${Math.max(0, ceiling - booked)} table(s) still available.`,
        })
      }
    }

    if (pending.length > 0) {
      const oldest = pending[0].createdAt
      const hours = Math.floor((Date.now() - oldest.getTime()) / 3_600_000)
      alerts.push({
        id: 'pending',
        tone: pending.length > 10 ? 'warn' : 'info',
        category: 'Reservations',
        title: `${pending.length} request${pending.length === 1 ? '' : 's'} awaiting approval`,
        detail:
          hours > 0
            ? `Oldest request has been pending for ${hours} hour${hours === 1 ? '' : 's'}.`
            : 'All pending requests arrived within the last hour.',
      })
    }

    for (const t of blockedTables) {
      alerts.push({
        id: `blocked-${t.code}`,
        tone: 'warn',
        category: 'Tables',
        title: `Table ${t.code} is blocked`,
        detail: 'It will not be offered to guests until it is unblocked.',
      })
    }

    if (openRequests > 0) {
      alerts.push({
        id: 'requests',
        tone: 'info',
        category: 'Food',
        title: `${openRequests} special request${openRequests === 1 ? '' : 's'} open`,
        detail: 'Review the kitchen queue on the Food Deals screen.',
      })
    }

    // Staffing gaps come from the stored prediction, when one exists.
    if (prediction) {
      try {
        const payload = JSON.parse(prediction.payload) as {
          byShift?: { shift: string; serving: number }[]
        }
        const evening = payload.byShift?.find((s) => s.shift.startsWith('Evening'))
        const rostered = await prisma.staffMember.count({
          where: { shift: 'Evening', role: 'Serving Staff', availability: { in: ['Available', 'On Shift'] } },
        })
        if (evening && rostered < evening.serving) {
          alerts.push({
            id: 'staffing',
            tone: 'warn',
            category: 'Staffing',
            title: 'Serving staff gap on the dinner shift',
            detail: `${evening.serving} required, ${rostered} rostered. Add ${evening.serving - rostered} more.`,
          })
        }
      } catch {
        // A malformed prediction payload must not break the dashboard.
      }
    }

    const recommendations = alerts
      .filter((a) => a.tone === 'danger' || a.tone === 'warn')
      .slice(0, 5)
      .map((a) => `${a.title} — ${a.detail}`)

    if (recommendations.length === 0) {
      recommendations.push(
        `Service is within target. Wastage goal is ${settings.wastageTargetPct}% and no slot is above 70% booked.`,
      )
    }

    res.json({ alerts, recommendations })
  }),
)

/* --------------------------------------------------------------- helpers */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function shortDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : DAY_NAMES[d.getUTCDay()]
}

/** "8:30 PM" → minutes since midnight. */
function toMinutes(label: string): number {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(label)
  if (!m) return 0
  let hour = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'PM') hour += 12
  return hour * 60 + Number(m[2] ?? 0)
}

function timeFallsInSlot(time: string, start: string, end: string): boolean {
  const t = toMinutes(time)
  const s = toMinutes(start)
  const e = toMinutes(end)
  return e > s ? t >= s && t < e : t >= s || t < e
}

/**
 * BO-12 / Module 7 — restaurant settings and the data-management summary.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { badRequest, parse, route } from '../lib/http.js'
import { getSetting, setSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'

export const settingsRouter = Router()

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

const view = requirePermission('view:settings')
const manage = requirePermission('manage:settings')

settingsRouter.get(
  '/',
  view,
  route(async (_req, res) => {
    const [profile, hours, rules, prediction] = await Promise.all([
      getSetting('restaurant.profile'),
      getSetting('restaurant.hours'),
      getSetting('reservation.rules'),
      getSetting('prediction.settings'),
    ])

    res.json({ profile, hours, rules, prediction })
  }),
)

settingsRouter.put(
  '/profile',
  manage,
  route(async (req, res) => {
    const current = await getSetting('restaurant.profile')
    const input = parse(
      z.object({
        name: z.string().trim().min(2).max(80).optional(),
        tagline: z.string().trim().max(80).optional(),
        cuisine: z.string().trim().max(40).optional(),
        phone: z.string().trim().max(40).optional(),
        email: z.string().trim().toLowerCase().email().optional(),
        address: z.string().trim().max(160).optional(),
        city: z.string().trim().max(60).optional(),
        currency: z.string().trim().max(20).optional(),
        timezone: z.string().trim().max(40).optional(),
      }),
      req.body,
    )

    const next = { ...current, ...input }
    await setSetting('restaurant.profile', next)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated restaurant profile', target: next.name, category: 'System' })
    res.json({ profile: next })
  }),
)

settingsRouter.put(
  '/hours',
  manage,
  route(async (req, res) => {
    // Opening hours are replaced wholesale, so a partial list would silently
    // delete the missing days. The whole week must be sent.
    const { hours } = parse(
      z.object({
        hours: z
          .array(
            z.object({
              day: z.enum(DAYS),
              open: z.string().trim().min(1),
              close: z.string().trim().min(1),
              closed: z.boolean(),
            }),
          )
          .length(7, 'Send all seven days.'),
      }),
      req.body,
    )

    const seen = new Set(hours.map((h) => h.day))
    if (seen.size !== 7) {
      throw badRequest('Each day must appear exactly once.', {
        hours: 'Send all seven days, without duplicates.',
      })
    }

    await setSetting('restaurant.hours', hours)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated opening hours', target: 'Restaurant hours', category: 'System' })
    res.json({ hours })
  }),
)

/** Module 3 FE-5 and the Module 1 booking constraints. */
settingsRouter.put(
  '/rules',
  manage,
  route(async (req, res) => {
    const current = await getSetting('reservation.rules')
    const input = parse(
      z.object({
        holdMinutes: z.coerce.number().int().min(0).max(240).optional(),
        maxPartySize: z.coerce.number().int().min(1).max(200).optional(),
        minPartySize: z.coerce.number().int().min(1).max(50).optional(),
        advanceDays: z.coerce.number().int().min(0).max(365).optional(),
        slotLengthMinutes: z.coerce.number().int().min(30).max(480).optional(),
        preventDoubleBooking: z.boolean().optional(),
        requireApproval: z.boolean().optional(),
        allowSameDay: z.boolean().optional(),
        autoReleaseNoShow: z.boolean().optional(),
      }),
      req.body,
    )

    const next = { ...current, ...input }
    if (next.minPartySize > next.maxPartySize) {
      throw badRequest('Minimum party size cannot exceed the maximum.', {
        minPartySize: 'Must be no larger than the maximum.',
      })
    }

    await setSetting('reservation.rules', next)
    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: 'Changed reservation rules',
      target: describeRuleChange({ ...current }, { ...next }),
      category: 'System',
    })
    res.json({ rules: next })
  }),
)

/** BO-12 — the prediction inputs. */
settingsRouter.put(
  '/prediction',
  manage,
  route(async (req, res) => {
    const current = await getSetting('prediction.settings')
    const input = parse(
      z.object({
        footfallModel: z.string().trim().max(60).optional(),
        revenueModel: z.string().trim().max(60).optional(),
        trainingWindow: z.string().trim().max(60).optional(),
        refreshInterval: z.string().trim().max(60).optional(),
        confidenceThreshold: z.coerce.number().min(0).max(100).optional(),
        wastageTargetPct: z.coerce.number().min(0).max(100).optional(),
        shortageBufferPct: z.coerce.number().min(0).max(100).optional(),
        guestsPerServer: z.coerce.number().int().min(1).max(200).optional(),
        guestsPerChef: z.coerce.number().int().min(1).max(200).optional(),
      }),
      req.body,
    )

    const next = { ...current, ...input }
    await setSetting('prediction.settings', next)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated prediction settings', target: 'Prediction', category: 'System' })
    res.json({ prediction: next })
  }),
)

/** Module 7 — what the centralised database actually holds. */
settingsRouter.get(
  '/data-summary',
  view,
  route(async (_req, res) => {
    const [
      reservations,
      customers,
      tables,
      sections,
      slots,
      deals,
      activeDeals,
      staff,
      shifts,
      predictions,
      metrics,
      messages,
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.findMany({ distinct: ['email'], select: { email: true } }),
      prisma.restaurantTable.count(),
      prisma.restaurantTable.groupBy({ by: ['section'] }),
      prisma.timeSlot.count(),
      prisma.deal.count(),
      prisma.deal.count({ where: { active: true } }),
      prisma.staffMember.count(),
      prisma.staffMember.groupBy({ by: ['shift'] }),
      prisma.predictionOutput.count(),
      prisma.dailyMetric.count(),
      prisma.notificationLog.count(),
    ])

    res.json({
      summary: [
        { label: 'Reservation records', value: reservations, detail: 'All statuses' },
        { label: 'Customer profiles', value: customers.length, detail: 'Unique email addresses' },
        { label: 'Table records', value: tables, detail: `Across ${sections.length} sections` },
        { label: 'Time slots', value: slots, detail: 'Configured per day' },
        { label: 'Food deals', value: deals, detail: `${activeDeals} active` },
        { label: 'Staff records', value: staff, detail: `Across ${shifts.length} shifts` },
        { label: 'Prediction outputs', value: predictions, detail: 'Stored forecast rows' },
        { label: 'Daily metric rows', value: metrics, detail: 'Source series for reports' },
        { label: 'Messages logged', value: messages, detail: 'Confirmations, reminders, updates' },
      ],
    })
  }),
)

function describeRuleChange(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string {
  const changed = Object.keys(after).filter((k) => before[k] !== after[k])
  if (changed.length === 0) return 'No change'
  return changed.map((k) => `${k} → ${String(after[k])}`).join(', ')
}

/**
 * Module 8 FE-5 to FE-8 — the communication centre: templates, the delivery
 * log, manual sends and resends.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { notFound, pageMeta, paginate, parse, route } from '../lib/http.js'
import { sendMessage } from '../lib/mailer.js'
import { getSetting, setSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'
import { mailEnabled } from '../env.js'

export const notificationsRouter = Router()

const view = requirePermission('view:communication')
const manage = requirePermission('manage:communication')

notificationsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(
      z.object({
        delivery: z.string().optional(),
        type: z.string().optional(),
        channel: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().optional(),
        perPage: z.coerce.number().optional(),
      }),
      req.query,
    )

    const where = {
      ...(q.delivery && !q.delivery.startsWith('All') ? { delivery: q.delivery } : {}),
      ...(q.type && !q.type.startsWith('All') ? { type: q.type } : {}),
      ...(q.channel && !q.channel.startsWith('All') ? { channel: q.channel } : {}),
      ...(q.search
        ? {
            OR: [
              { customerName: { contains: q.search.trim() } },
              { email: { contains: q.search.trim() } },
              { reference: { contains: q.search.trim() } },
            ],
          }
        : {}),
    }

    const { page, perPage, skip, take } = paginate(q)
    const [rows, total] = await Promise.all([
      prisma.notificationLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.notificationLog.count({ where }),
    ])

    res.json({
      notifications: rows.map((n) => ({
        id: n.id,
        reference: n.reference,
        customerName: n.customerName,
        phone: n.phone,
        email: n.email,
        channel: n.channel,
        type: n.type,
        body: n.body,
        delivery: n.delivery,
        error: n.error,
        sentAt: n.sentAt,
        createdAt: n.createdAt,
      })),
      meta: pageMeta(total, page, perPage),
    })
  }),
)

/** Counters for the Communication screen header. */
notificationsRouter.get(
  '/stats',
  view,
  route(async (_req, res) => {
    const since = new Date(Date.now() - 86_400_000)
    const [sentToday, confirmations, reminders, pending, total, delivered] = await Promise.all([
      prisma.notificationLog.count({ where: { createdAt: { gte: since } } }),
      prisma.notificationLog.count({ where: { type: 'Confirmation' } }),
      prisma.notificationLog.count({ where: { type: 'Reminder', delivery: { in: ['Scheduled', 'Pending'] } } }),
      prisma.notificationLog.count({ where: { delivery: { in: ['Pending', 'Scheduled'] } } }),
      prisma.notificationLog.count(),
      prisma.notificationLog.count({ where: { delivery: 'Sent' } }),
    ])

    res.json({
      sentToday,
      confirmations,
      reminders,
      pending,
      successRate: total ? Number(((delivered / total) * 100).toFixed(1)) : 0,
      /** The UI must not imply delivery when no transport is configured. */
      transportConfigured: mailEnabled,
    })
  }),
)

/** Recent activity feed. */
notificationsRouter.get(
  '/activity',
  view,
  route(async (_req, res) => {
    const rows = await prisma.notificationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 })
    res.json({
      activity: rows.map((n) => ({
        id: n.id,
        at: n.createdAt,
        title:
          n.delivery === 'Failed'
            ? 'Failed message needs resend'
            : n.delivery === 'Sent'
              ? `${n.type} delivered`
              : `${n.type} ${n.delivery.toLowerCase()}`,
        detail: `To ${n.customerName} via ${n.channel}`,
        tone: n.delivery === 'Failed' ? 'danger' : n.delivery === 'Sent' ? 'success' : 'warn',
      })),
    })
  }),
)

/* ------------------------------------------------------------- templates */

notificationsRouter.get(
  '/templates',
  view,
  route(async (_req, res) => {
    const rows = await prisma.messageTemplate.findMany({ orderBy: { createdAt: 'asc' } })
    res.json({ templates: rows })
  }),
)

notificationsRouter.patch(
  '/templates/:id',
  manage,
  route(async (req, res) => {
    const input = parse(
      z.object({
        title: z.string().trim().min(2).max(80).optional(),
        body: z.string().trim().min(5).max(1000).optional(),
        channel: z.enum(['Email', 'SMS', 'WhatsApp']).optional(),
        active: z.boolean().optional(),
      }),
      req.body,
    )

    const existing = await prisma.messageTemplate.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Template not found.')

    const updated = await prisma.messageTemplate.update({ where: { id: existing.id }, data: input })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated message template', target: updated.title, category: 'Message' })
    res.json({ template: updated })
  }),
)

/* ---------------------------------------------------------------- sends */

/** Manual send against a booking (Module 8 FE-7). */
notificationsRouter.post(
  '/send',
  manage,
  route(async (req, res) => {
    const input = parse(
      z.object({
        reference: z.string().trim().min(3),
        type: z.enum(['Confirmation', 'Reminder', 'Update', 'Cancellation', 'Special Request']),
      }),
      req.body,
    )

    const reservation = await prisma.reservation.findUnique({
      where: { reference: input.reference.toUpperCase() },
    })
    if (!reservation) throw notFound('No booking with that reference.')

    const result = await sendMessage({
      to: reservation.email,
      phone: reservation.phone,
      type: input.type,
      reference: reservation.reference,
      customerName: reservation.customerName,
      vars: {
        date: reservation.date,
        time: reservation.timeSlot,
        table: reservation.tableCode,
        reference: reservation.reference,
      },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: `Sent ${input.type.toLowerCase()}`, target: reservation.reference, category: 'Message' })
    res.json(result)
  }),
)

/** Retries a failed or pending log entry. */
notificationsRouter.post(
  '/:id/resend',
  manage,
  route(async (req, res) => {
    const existing = await prisma.notificationLog.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Message not found.')

    const settings = await getSetting('notification.settings')
    if (!settings.allowManualResend) {
      throw notFound('Manual resend is turned off in notification settings.')
    }

    const result = await sendMessage({
      to: existing.email,
      phone: existing.phone,
      type: existing.type as 'Confirmation',
      reference: existing.reference,
      customerName: existing.customerName,
      body: existing.body || undefined,
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Resent message', target: existing.customerName, category: 'Message' })
    res.json(result)
  }),
)

/* --------------------------------------------------------------- settings */

notificationsRouter.get(
  '/settings',
  view,
  route(async (_req, res) => {
    res.json({ settings: await getSetting('notification.settings'), transportConfigured: mailEnabled })
  }),
)

notificationsRouter.put(
  '/settings',
  manage,
  route(async (req, res) => {
    const current = await getSetting('notification.settings')
    const input = parse(
      z.object({
        confirmOnApproval: z.boolean().optional(),
        reminderEnabled: z.boolean().optional(),
        reminderHoursBefore: z.coerce.number().int().min(1).max(72).optional(),
        cancellationEnabled: z.boolean().optional(),
        allowManualResend: z.boolean().optional(),
      }),
      req.body,
    )

    const next = { ...current, ...input }
    await setSetting('notification.settings', next)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated notification settings', target: 'Communication', category: 'System' })
    res.json({ settings: next })
  }),
)

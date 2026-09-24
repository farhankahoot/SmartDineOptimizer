/**
 * Super Admin control centre: landing-page content, system-wide switches,
 * feature flags, the audit trail and system health.
 *
 * No route here returns a secret. Health reports whether a credential is
 * *configured*, never the credential itself.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit, notifyAdmins } from '../lib/audit.js'
import { badRequest, notFound, pageMeta, paginate, parse, route } from '../lib/http.js'
import { getSetting, setSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'
import { env, mailEnabled } from '../env.js'

export const platformRouter = Router()

/* -------------------------------------------------------------- content */

platformRouter.get(
  '/content',
  requirePermission('manage:content'),
  route(async (_req, res) => {
    res.json({ content: await getSetting('landing.content') })
  }),
)

platformRouter.put(
  '/content',
  requirePermission('manage:content'),
  route(async (req, res) => {
    const current = await getSetting('landing.content')
    const input = parse(
      z.object({
        heroTitleAccent: z.string().trim().max(80).optional(),
        heroSubtitle: z.string().trim().max(600).optional(),
        finalCtaTitle: z.string().trim().max(120).optional(),
        finalCtaBody: z.string().trim().max(400).optional(),
        announcementEnabled: z.boolean().optional(),
        announcementText: z.string().trim().max(200).optional(),
      }),
      req.body,
    )

    const next = { ...current, ...input }
    await setSetting('landing.content', next)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated landing page content', target: 'Landing page', category: 'Content' })
    res.json({ content: next })
  }),
)

/* --------------------------------------------------------------- system */

platformRouter.get(
  '/system',
  requirePermission('manage:system'),
  route(async (_req, res) => {
    res.json({ system: await getSetting('system.controls') })
  }),
)

/** Module 8 FE-3 — maintenance, read-only and admin-only-login switches. */
platformRouter.put(
  '/system',
  requirePermission('manage:system'),
  route(async (req, res) => {
    const current = await getSetting('system.controls')
    const input = parse(
      z.object({
        maintenanceMode: z.boolean().optional(),
        maintenanceMessage: z.string().trim().max(400).optional(),
        maintenanceEta: z.string().trim().max(80).optional(),
        adminOnlyLogin: z.boolean().optional(),
        publicBookingEnabled: z.boolean().optional(),
        trackingEnabled: z.boolean().optional(),
        registrationEnabled: z.boolean().optional(),
        sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440).optional(),
        minPasswordLength: z.coerce.number().int().min(6).max(64).optional(),
        requireStrongPassword: z.boolean().optional(),
        readOnlyMode: z.boolean().optional(),
      }),
      req.body,
    )

    const next = { ...current, ...input }
    await setSetting('system.controls', next)

    const changed = Object.keys(input).filter(
      (k) => current[k as keyof typeof current] !== next[k as keyof typeof next],
    )

    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: 'Changed system controls',
      target: changed.length ? changed.map((k) => `${k} → ${String(next[k as keyof typeof next])}`).join(', ') : 'No change',
      category: 'System',
    })

    // The switches that take the product offline deserve a visible record.
    if (input.maintenanceMode === true) {
      await notifyAdmins({ tone: 'danger', title: 'Maintenance mode enabled', detail: `The public site is offline. Enabled by ${req.user!.name}.`, link: '/superadmin/system' })
    }
    if (input.readOnlyMode === true) {
      await notifyAdmins({ tone: 'warning', title: 'Read-only mode enabled', detail: `Console changes are blocked. Enabled by ${req.user!.name}.`, link: '/superadmin/system' })
    }
    if (input.adminOnlyLogin === true) {
      await notifyAdmins({ tone: 'warning', title: 'Admin-only sign-in enabled', detail: `Managers and staff cannot sign in. Enabled by ${req.user!.name}.`, link: '/superadmin/security' })
    }

    res.json({ system: next })
  }),
)

/* -------------------------------------------------------- feature flags */

platformRouter.get(
  '/features',
  requirePermission('manage:features'),
  route(async (_req, res) => {
    res.json({ features: await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } }) })
  }),
)

platformRouter.patch(
  '/features/:key',
  requirePermission('manage:features'),
  route(async (req, res) => {
    const { enabled } = parse(z.object({ enabled: z.boolean() }), req.body)

    const existing = await prisma.featureFlag.findUnique({ where: { key: req.params.key } })
    if (!existing) throw notFound('Feature flag not found.')

    const updated = await prisma.featureFlag.update({ where: { key: existing.key }, data: { enabled } })
    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: `${enabled ? 'Enabled' : 'Disabled'} feature flag`,
      target: updated.name,
      category: 'Feature',
    })

    res.json({ feature: updated })
  }),
)

/* -------------------------------------------------------------- audit log */

platformRouter.get(
  '/audit',
  requirePermission('view:audit'),
  route(async (req, res) => {
    const q = parse(
      z.object({
        category: z.string().optional(),
        result: z.string().optional(),
        actor: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().optional(),
        perPage: z.coerce.number().optional(),
      }),
      req.query,
    )

    const where = {
      ...(q.category && !q.category.startsWith('All') ? { category: q.category } : {}),
      ...(q.result && !q.result.startsWith('All') ? { result: q.result } : {}),
      ...(q.actor && !q.actor.startsWith('All') ? { actorName: q.actor } : {}),
      ...(q.search
        ? {
            OR: [
              { action: { contains: q.search.trim() } },
              { target: { contains: q.search.trim() } },
              { actorName: { contains: q.search.trim() } },
            ],
          }
        : {}),
    }

    const { page, perPage, skip, take } = paginate(q)
    const [rows, total] = await Promise.all([
      prisma.auditEntry.findMany({ where, orderBy: { at: 'desc' }, skip, take }),
      prisma.auditEntry.count({ where }),
    ])

    res.json({
      entries: rows.map((r) => ({
        id: r.id,
        at: r.at,
        actor: r.actorName,
        action: r.action,
        target: r.target,
        category: r.category,
        result: r.result,
      })),
      meta: pageMeta(total, page, perPage),
    })
  }),
)

/* ------------------------------------------------------ admin notifications */

platformRouter.get(
  '/notifications',
  requirePermission('view:platform'),
  route(async (_req, res) => {
    const [rows, unread] = await Promise.all([
      prisma.adminNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.adminNotification.count({ where: { read: false } }),
    ])
    res.json({ notifications: rows, unreadCount: unread })
  }),
)

platformRouter.post(
  '/notifications/:id/read',
  requirePermission('view:platform'),
  route(async (req, res) => {
    await prisma.adminNotification
      .update({ where: { id: req.params.id }, data: { read: true } })
      .catch(() => {
        throw notFound('Notification not found.')
      })
    res.json({ ok: true })
  }),
)

platformRouter.post(
  '/notifications/read-all',
  requirePermission('view:platform'),
  route(async (_req, res) => {
    const result = await prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true },
    })
    res.json({ marked: result.count })
  }),
)

/* ----------------------------------------------------------- sessions */

/** Every live session on the platform, for the Security screen. */
platformRouter.get(
  '/sessions',
  requirePermission('manage:security'),
  route(async (req, res) => {
    const rows = await prisma.session.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { lastSeenAt: 'desc' },
    })

    res.json({
      sessions: rows.map((s) => ({
        id: s.id,
        user: s.user.name,
        email: s.user.email,
        role: s.user.role,
        device: s.device,
        location: s.location,
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        current: s.tokenId === req.user!.tokenId,
      })),
    })
  }),
)

platformRouter.delete(
  '/sessions/:id',
  requirePermission('manage:security'),
  route(async (req, res) => {
    const session = await prisma.session.findUnique({ where: { id: req.params.id }, include: { user: true } })
    if (!session) throw notFound('Session not found.')
    if (session.tokenId === req.user!.tokenId) {
      throw badRequest('That is your current session — use sign out instead.')
    }

    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Ended a session', target: session.user.email, category: 'Security' })
    res.json({ ok: true })
  }),
)

/* ---------------------------------------------------------------- health */

/**
 * Configuration state, not synthetic uptime. Each check reports something the
 * server can actually establish — and never the value of a credential.
 */
platformRouter.get(
  '/health',
  requirePermission('view:health'),
  route(async (_req, res) => {
    const started = Date.now()
    let dbState: 'Operational' | 'Down' = 'Operational'
    let dbDetail = ''
    let latencyMs: number | null = null

    try {
      await prisma.$queryRaw`SELECT 1`
      latencyMs = Date.now() - started
      dbDetail = `SQLite responded in ${latencyMs}ms.`
    } catch (err) {
      dbState = 'Down'
      dbDetail = err instanceof Error ? err.message : 'The database did not respond.'
    }

    const [predictions, newestPrediction, failedMessages] = await Promise.all([
      prisma.predictionOutput.count(),
      prisma.predictionOutput.findFirst({ orderBy: { generatedAt: 'desc' }, select: { generatedAt: true, model: true } }),
      prisma.notificationLog.count({ where: { delivery: 'Failed' } }),
    ])

    res.json({
      checks: [
        { id: 'app', name: 'Web application', state: 'Operational', detail: 'React front end served from the origin.' },
        { id: 'api', name: 'REST API', state: 'Operational', detail: `Express API responding on port ${env.port}.` },
        { id: 'db', name: 'Database', state: dbState, detail: dbDetail, latencyMs },
        { id: 'auth', name: 'Authentication', state: 'Operational', detail: 'Server-side sessions with revocable tokens.' },
        {
          id: 'storage',
          name: 'Media storage',
          state: 'Not configured',
          // Nothing in this build uploads a file any more — the one feature
          // that did (showcase covers, stored inline as data URLs) is gone.
          detail: 'No object storage is configured, and nothing currently uploads to it.',
        },
        {
          id: 'prediction',
          name: 'Prediction service',
          state: predictions > 0 ? 'Degraded' : 'Not configured',
          detail:
            newestPrediction?.model === 'seed' || !newestPrediction
              ? `${predictions} stored forecast row(s), all seeded. No training service is connected.`
              : `Last ingest ${newestPrediction.generatedAt.toISOString()} from "${newestPrediction.model}".`,
        },
        {
          id: 'smtp',
          name: 'Email (SMTP)',
          state: mailEnabled ? (failedMessages > 0 ? 'Degraded' : 'Operational') : 'Not configured',
          detail: mailEnabled
            ? failedMessages > 0
              ? `SMTP host configured. ${failedMessages} message(s) failed to send.`
              : 'SMTP host configured and no failures recorded.'
            : 'No SMTP host is set, so messages are logged instead of delivered.',
        },
      ],
      /** Uptime of this process, which is a fact the server can report. */
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000),
    })
  }),
)

/* ------------------------------------------------------------- overview */

platformRouter.get(
  '/overview',
  requirePermission('view:platform'),
  route(async (_req, res) => {
    const [users, activeUsers, suspended, sessions, flags, enabledFlags, system, auditToday] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'Active' } }),
        prisma.user.count({ where: { status: 'Suspended' } }),
        prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
        prisma.featureFlag.count(),
        prisma.featureFlag.count({ where: { enabled: true } }),
        getSetting('system.controls'),
        prisma.auditEntry.count({ where: { at: { gte: new Date(Date.now() - 86_400_000) } } }),
      ])

    res.json({
      users: { total: users, active: activeUsers, suspended },
      sessions,
      features: { total: flags, enabled: enabledFlags },
      auditLast24h: auditToday,
      status: {
        maintenanceMode: system.maintenanceMode,
        readOnlyMode: system.readOnlyMode,
        adminOnlyLogin: system.adminOnlyLogin,
        publicBookingEnabled: system.publicBookingEnabled,
      },
    })
  }),
)

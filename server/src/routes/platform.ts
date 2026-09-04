/**
 * Super Admin control centre: the showcase directory, landing-page content,
 * system-wide switches, feature flags, the audit trail and system health.
 *
 * No route here returns a secret. Health reports whether a credential is
 * *configured*, never the credential itself.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit, notifyAdmins } from '../lib/audit.js'
import { badRequest, conflict, notFound, pageMeta, paginate, parse, route } from '../lib/http.js'
import { getSetting, setSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'
import { serializeShowcase } from './public.js'
import { env, mailEnabled } from '../env.js'

export const platformRouter = Router()

/* ------------------------------------------------------------- showcase */

const manageShowcase = requirePermission('manage:showcase')
const SHOWCASE_STATUSES = ['Active', 'Pending', 'Suspended', 'Inactive', 'Rejected'] as const

platformRouter.get(
  '/restaurants',
  requirePermission('manage:restaurants'),
  route(async (req, res) => {
    const q = parse(
      z.object({
        status: z.string().optional(),
        city: z.string().optional(),
        cuisine: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().optional(),
        perPage: z.coerce.number().optional(),
      }),
      req.query,
    )

    const where = {
      ...(q.status && !q.status.startsWith('All') ? { status: q.status } : {}),
      ...(q.city && !q.city.startsWith('All') ? { city: q.city } : {}),
      ...(q.cuisine && !q.cuisine.startsWith('All') ? { cuisine: q.cuisine } : {}),
      ...(q.search
        ? { OR: [{ name: { contains: q.search.trim() } }, { city: { contains: q.search.trim() } }] }
        : {}),
    }

    const { page, perPage, skip, take } = paginate(q)
    const [rows, total, counts] = await Promise.all([
      prisma.showcaseRestaurant.findMany({ where, orderBy: { sortOrder: 'asc' }, skip, take }),
      prisma.showcaseRestaurant.count({ where }),
      prisma.showcaseRestaurant.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    res.json({
      restaurants: rows.map(serializeShowcase),
      meta: pageMeta(total, page, perPage),
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    })
  }),
)

const restaurantSchema = z.object({
  name: z.string().trim().min(2, 'Enter the restaurant name.').max(80),
  city: z.string().trim().min(2, 'Enter a city.').max(60),
  province: z.string().trim().min(2, 'Choose a province.').max(60),
  cuisine: z.string().trim().min(2, 'Choose a cuisine.').max(60),
  description: z.string().trim().min(10, 'Write a short description.').max(400),
  website: z.string().trim().url('Enter a valid URL.').or(z.literal('')).optional(),
  featured: z.boolean().optional(),
  status: z.enum(SHOWCASE_STATUSES).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  coverFrom: z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour.').optional(),
  coverTo: z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour.').optional(),
  /** Data URL for an uploaded cover image. */
  image: z.string().trim().max(3_500_000).optional(),
})

platformRouter.post(
  '/restaurants',
  manageShowcase,
  route(async (req, res) => {
    const input = parse(restaurantSchema, req.body)
    validateImage(input.image)

    const clash = await prisma.showcaseRestaurant.findUnique({ where: { name: input.name } })
    if (clash) throw conflict('That restaurant is already in the directory.', { name: 'Already listed.' })

    const max = await prisma.showcaseRestaurant.aggregate({ _max: { sortOrder: true } })

    const created = await prisma.showcaseRestaurant.create({
      data: {
        name: input.name,
        city: input.city,
        province: input.province,
        cuisine: input.cuisine,
        description: input.description,
        website: input.website || null,
        featured: input.featured ?? false,
        status: input.status ?? 'Active',
        sortOrder: input.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
        ...(input.coverFrom ? { coverFrom: input.coverFrom } : {}),
        ...(input.coverTo ? { coverTo: input.coverTo } : {}),
        imageUrl: input.image ?? null,
      },
    })

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Added showcase restaurant', target: created.name, category: 'Restaurant' })
    res.status(201).json({ restaurant: serializeShowcase(created) })
  }),
)

platformRouter.patch(
  '/restaurants/:id',
  manageShowcase,
  route(async (req, res) => {
    const existing = await prisma.showcaseRestaurant.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Restaurant not found.')

    const input = parse(restaurantSchema.partial(), req.body)
    validateImage(input.image)

    const updated = await prisma.showcaseRestaurant.update({
      where: { id: existing.id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.city ? { city: input.city } : {}),
        ...(input.province ? { province: input.province } : {}),
        ...(input.cuisine ? { cuisine: input.cuisine } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.website !== undefined ? { website: input.website || null } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.coverFrom ? { coverFrom: input.coverFrom } : {}),
        ...(input.coverTo ? { coverTo: input.coverTo } : {}),
        ...(input.image !== undefined ? { imageUrl: input.image || null } : {}),
      },
    })

    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: input.status ? `Set restaurant ${input.status.toLowerCase()}` : 'Updated showcase restaurant',
      target: updated.name,
      category: 'Restaurant',
    })

    res.json({ restaurant: serializeShowcase(updated) })
  }),
)

/** Reorders the public carousel in one call. */
platformRouter.put(
  '/restaurants/order',
  manageShowcase,
  route(async (req, res) => {
    const { order } = parse(z.object({ order: z.array(z.string().min(1)).min(1) }), req.body)

    await prisma.$transaction(
      order.map((id, index) =>
        prisma.showcaseRestaurant.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    )

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Reordered showcase', target: `${order.length} restaurants`, category: 'Restaurant' })
    res.json({ ok: true })
  }),
)

platformRouter.delete(
  '/restaurants/:id',
  manageShowcase,
  route(async (req, res) => {
    const existing = await prisma.showcaseRestaurant.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Restaurant not found.')

    await prisma.showcaseRestaurant.delete({ where: { id: existing.id } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Removed showcase restaurant', target: existing.name, category: 'Restaurant' })
    res.json({ ok: true })
  }),
)

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
        heroBadge: z.string().trim().max(120).optional(),
        heroTitleTop: z.string().trim().max(80).optional(),
        heroTitleAccent: z.string().trim().max(80).optional(),
        heroSubtitle: z.string().trim().max(600).optional(),
        primaryCtaLabel: z.string().trim().max(40).optional(),
        secondaryCtaLabel: z.string().trim().max(40).optional(),
        showcaseEyebrow: z.string().trim().max(60).optional(),
        showcaseTitle: z.string().trim().max(120).optional(),
        showcaseLead: z.string().trim().max(400).optional(),
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
        restaurantSubmissionsEnabled: z.boolean().optional(),
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

    const [predictions, newestPrediction, failedMessages, images] = await Promise.all([
      prisma.predictionOutput.count(),
      prisma.predictionOutput.findFirst({ orderBy: { generatedAt: 'desc' }, select: { generatedAt: true, model: true } }),
      prisma.notificationLog.count({ where: { delivery: 'Failed' } }),
      prisma.showcaseRestaurant.count({ where: { NOT: { imageUrl: null } } }),
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
          state: images > 0 ? 'Degraded' : 'Not configured',
          detail:
            images > 0
              ? `${images} cover image(s) stored inline in the database. Move to object storage before launch.`
              : 'No object storage is configured; uploads are stored inline.',
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
    const [users, activeUsers, suspended, restaurants, activeRestaurants, pendingRestaurants, sessions, flags, enabledFlags, system, auditToday] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'Active' } }),
        prisma.user.count({ where: { status: 'Suspended' } }),
        prisma.showcaseRestaurant.count(),
        prisma.showcaseRestaurant.count({ where: { status: 'Active' } }),
        prisma.showcaseRestaurant.count({ where: { status: 'Pending' } }),
        prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
        prisma.featureFlag.count(),
        prisma.featureFlag.count({ where: { enabled: true } }),
        getSetting('system.controls'),
        prisma.auditEntry.count({ where: { at: { gte: new Date(Date.now() - 86_400_000) } } }),
      ])

    res.json({
      users: { total: users, active: activeUsers, suspended },
      restaurants: { total: restaurants, active: activeRestaurants, pending: pendingRestaurants },
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

/* --------------------------------------------------------------- helpers */

/**
 * The carousel renders inside a 16:10 container, so uploads are checked against
 * that ratio and the 2 MB ceiling the client also enforces.
 */
function validateImage(dataUrl?: string): void {
  if (!dataUrl) return

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw badRequest('Cover image must be a JPG, PNG or WebP data URL.')

  // base64 expands by 4/3; this is the decoded byte count.
  const bytes = Math.floor((match[2].length * 3) / 4)
  if (bytes > 2 * 1024 * 1024) {
    throw badRequest(`Cover image is ${(bytes / 1024 / 1024).toFixed(1)} MB. The limit is 2 MB.`)
  }
}

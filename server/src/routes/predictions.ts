/**
 * Module 5 — prediction storage and serving.
 *
 * FE-7 requires prediction outputs to be stored for dashboard visualisation and
 * reporting; that is what this router does. Model *training* is a separate
 * Python service which is not part of this build — `POST /ingest` is the
 * contract it will write to, and `model` on every row records what produced it,
 * so nothing here claims a forecast came from a trained model when it did not.
 *
 * LI-6: forecasts are decision support. Nothing acts on them automatically.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { notFound, parse, route } from '../lib/http.js'
import { getSetting } from '../lib/settings.js'
import { requirePermission } from '../middleware/auth.js'

export const predictionsRouter = Router()

const view = requirePermission('view:prediction')

const KINDS = [
  'footfall',
  'revenue',
  'food-demand',
  'staffing',
  'peak-hour',
  'sales-forecast',
] as const

/** Every stored forecast for a day, plus how it was produced. */
predictionsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const { date } = parse(z.object({ date: z.string().optional() }), req.query)

    const scopeDate =
      date ??
      (
        await prisma.predictionOutput.findFirst({
          orderBy: { scopeDate: 'desc' },
          select: { scopeDate: true },
        })
      )?.scopeDate

    if (!scopeDate) {
      return res.json({ scopeDate: null, outputs: {}, generatedAt: null, model: null, stale: true })
    }

    const [rows, settings] = await Promise.all([
      prisma.predictionOutput.findMany({ where: { scopeDate } }),
      getSetting('prediction.settings'),
    ])

    const outputs: Record<string, unknown> = {}
    for (const row of rows) {
      try {
        outputs[row.kind] = JSON.parse(row.payload)
      } catch {
        outputs[row.kind] = null
      }
    }

    const newest = rows.reduce<Date | null>(
      (latest, r) => (!latest || r.generatedAt > latest ? r.generatedAt : latest),
      null,
    )

    res.json({
      scopeDate,
      outputs,
      generatedAt: newest,
      /** "seed" means these rows are fixtures, not a trained model's output. */
      model: rows[0]?.model ?? null,
      confidence: rows[0]?.confidence ?? null,
      settings: {
        footfallModel: settings.footfallModel,
        revenueModel: settings.revenueModel,
        trainingWindow: settings.trainingWindow,
        refreshInterval: settings.refreshInterval,
        confidenceThreshold: settings.confidenceThreshold,
      },
      /** True when nothing has been generated in the last 24 hours. */
      stale: newest ? Date.now() - newest.getTime() > 86_400_000 : true,
    })
  }),
)

/** The headline cards on the Prediction screen. */
predictionsRouter.get(
  '/summary',
  view,
  route(async (req, res) => {
    const { date } = parse(z.object({ date: z.string().optional() }), req.query)

    const scopeDate =
      date ??
      (
        await prisma.predictionOutput.findFirst({
          orderBy: { scopeDate: 'desc' },
          select: { scopeDate: true },
        })
      )?.scopeDate

    const rows = scopeDate
      ? await prisma.predictionOutput.findMany({ where: { scopeDate } })
      : []

    const payloadFor = (kind: string) => {
      const row = rows.find((r) => r.kind === kind)
      if (!row) return null
      try {
        return JSON.parse(row.payload) as Record<string, unknown>
      } catch {
        return null
      }
    }

    const settings = await getSetting('prediction.settings')

    const revenue = payloadFor('revenue') as { hourly?: { predicted: number }[] } | null
    const footfall = payloadFor('footfall') as {
      hourly?: { t: string; v: number }[]
      busiestSlot?: { range: string; footfall: string }
    } | null
    const staffing = payloadFor('staffing') as {
      byShift?: { chefs: number; serving: number; cleaning: number }[]
    } | null

    const predictedRevenue = revenue?.hourly?.reduce((n, h) => n + h.predicted, 0) ?? null
    const expectedFootfall = footfall?.hourly?.reduce((n, h) => n + h.v, 0) ?? null
    const peak = footfall?.hourly?.reduce<{ t: string; v: number } | null>(
      (best, h) => (!best || h.v > best.v ? h : best),
      null,
    )
    const staffRequired = staffing?.byShift?.reduce(
      (n, s) => n + s.chefs + s.serving + s.cleaning,
      0,
    ) ?? null

    res.json({
      scopeDate: scopeDate ?? null,
      predictedRevenue,
      expectedFootfall,
      peakHour: peak?.t ?? footfall?.busiestSlot?.range ?? null,
      staffRequired,
      wastageTargetPct: settings.wastageTargetPct,
      shortageBufferPct: settings.shortageBufferPct,
      /** Absent rather than invented when no model has run. */
      available: rows.length > 0,
    })
  }),
)

/** History for one forecast family, so trends can be charted over time. */
predictionsRouter.get(
  '/:kind/history',
  view,
  route(async (req, res) => {
    const kind = req.params.kind
    if (!(KINDS as readonly string[]).includes(kind)) throw notFound('Unknown prediction kind.')

    const rows = await prisma.predictionOutput.findMany({
      where: { kind },
      orderBy: { scopeDate: 'desc' },
      take: 30,
    })

    res.json({
      kind,
      history: rows.map((r) => ({
        scopeDate: r.scopeDate,
        generatedAt: r.generatedAt,
        model: r.model,
        confidence: r.confidence,
        payload: safeParse(r.payload),
      })),
    })
  }),
)

/**
 * Ingestion endpoint for the prediction service (Module 5 FE-7).
 *
 * Writing predictions is a system-level action, so it needs `manage:system`
 * rather than the read permission the dashboard uses.
 */
predictionsRouter.post(
  '/ingest',
  requirePermission('manage:system'),
  route(async (req, res) => {
    const input = parse(
      z.object({
        scopeDate: z.string().min(8),
        model: z.string().min(1).default('external'),
        confidence: z.number().min(0).max(1).optional(),
        outputs: z.record(z.enum(KINDS), z.unknown()),
      }),
      req.body,
    )

    const entries = Object.entries(input.outputs)
    for (const [kind, payload] of entries) {
      await prisma.predictionOutput.upsert({
        where: { kind_scopeDate: { kind, scopeDate: input.scopeDate } },
        create: {
          kind,
          scopeDate: input.scopeDate,
          payload: JSON.stringify(payload),
          model: input.model,
          confidence: input.confidence ?? null,
        },
        update: {
          payload: JSON.stringify(payload),
          model: input.model,
          confidence: input.confidence ?? null,
          generatedAt: new Date(),
        },
      })
    }

    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: 'Ingested prediction outputs',
      target: `${input.scopeDate} · ${entries.length} kind(s) · ${input.model}`,
      category: 'System',
    })

    res.status(201).json({ stored: entries.length, scopeDate: input.scopeDate })
  }),
)

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

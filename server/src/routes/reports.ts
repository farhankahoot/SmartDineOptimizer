/**
 * Module 6 FE-7 — daily, weekly and monthly reports across the five families
 * the proposal names, plus CSV export.
 *
 * Weekly and monthly rows are aggregated from the daily series rather than
 * stored separately, so every level of the report agrees with the others.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import { parse, route } from '../lib/http.js'
import { requirePermission } from '../middleware/auth.js'

export const reportsRouter = Router()

const view = requirePermission('view:reports')

const REPORT_TYPES = [
  'Reservations',
  'Revenue',
  'Food Wastage',
  'Staff Requirement',
  'Sales Forecast',
] as const

const PERIODS = ['Daily', 'Weekly', 'Monthly'] as const

export interface ReportRow {
  period: string
  key: string
  reservations: number
  guests: number
  confirmed: number
  cancelled: number
  revenue: number
  wastagePct: number
  staffRequired: number
  forecastRevenue: number
}

const querySchema = z.object({
  period: z.enum(PERIODS).default('Daily'),
  type: z.enum(REPORT_TYPES).default('Reservations'),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(400).optional(),
})

reportsRouter.get(
  '/',
  view,
  route(async (req, res) => {
    const q = parse(querySchema, req.query)
    const rows = await buildRows(q)

    res.json({
      period: q.period,
      type: q.type,
      columns: COLUMNS[q.type],
      rows,
      totals: totalsFor(rows),
    })
  }),
)

/** Module 6 FE-7 — export. CSV is generated server-side so it matches the table. */
reportsRouter.get(
  '/export',
  view,
  route(async (req, res) => {
    const q = parse(querySchema, req.query)
    const rows = await buildRows(q)
    const columns: (keyof ReportRow)[] = ['period', ...COLUMNS[q.type]]

    const header = columns.map((c) => LABELS[c]).join(',')
    const body = rows
      .map((row) => columns.map((c) => csvCell(row[c])).join(','))
      .join('\n')

    const filename = `smartdine-${q.type.toLowerCase().replace(/\s+/g, '-')}-${q.period.toLowerCase()}.csv`

    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: 'Exported report',
      target: `${q.type} · ${q.period}`,
      category: 'System',
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(`${header}\n${body}\n`)
  }),
)

/** The saved-report list is derived from export entries in the audit trail. */
reportsRouter.get(
  '/history',
  view,
  route(async (_req, res) => {
    const rows = await prisma.auditEntry.findMany({
      where: { action: 'Exported report' },
      orderBy: { at: 'desc' },
      take: 20,
    })

    res.json({
      reports: rows.map((r) => ({
        id: r.id,
        name: r.target,
        generated: r.at,
        generatedBy: r.actorName,
        format: 'CSV',
      })),
    })
  }),
)

/* ------------------------------------------------------------ aggregation */

async function buildRows(q: z.infer<typeof querySchema>): Promise<ReportRow[]> {
  const metrics = await prisma.dailyMetric.findMany({
    where: {
      ...(q.from || q.to
        ? { date: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
        : {}),
    },
    orderBy: { date: 'asc' },
  })

  const rowFor = (key: string, label: string, group: typeof metrics): ReportRow => ({
    key,
    period: label,
    reservations: group.reduce((n, m) => n + m.reservations, 0),
    guests: group.reduce((n, m) => n + m.guests, 0),
    confirmed: group.reduce((n, m) => n + m.confirmed, 0),
    cancelled: group.reduce((n, m) => n + m.cancelled, 0),
    revenue: group.reduce((n, m) => n + m.revenueMinor, 0) / 100,
    forecastRevenue: group.reduce((n, m) => n + m.forecastRevenueMinor, 0) / 100,
    // An average, not a sum — a percentage cannot be added up.
    wastagePct: group.length
      ? Number((group.reduce((n, m) => n + m.wastagePct, 0) / group.length).toFixed(1))
      : 0,
    // Peak requirement across the range is what staffing must cover.
    staffRequired: group.reduce((n, m) => Math.max(n, m.staffRequired), 0),
  })

  let rows: ReportRow[]

  if (q.period === 'Daily') {
    rows = metrics.map((m) => rowFor(m.date, longDate(m.date), [m]))
  } else {
    const groups = new Map<string, typeof metrics>()
    for (const m of metrics) {
      const key = q.period === 'Weekly' ? isoWeekKey(m.date) : m.date.slice(0, 7)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(m)
    }
    rows = [...groups.entries()].map(([key, group]) =>
      rowFor(key, q.period === 'Weekly' ? weekLabel(group) : monthLabel(key), group),
    )
  }

  // Newest first, capped so a five-month daily report stays readable.
  rows.reverse()
  return rows.slice(0, q.limit ?? (q.period === 'Daily' ? 30 : 24))
}

function totalsFor(rows: ReportRow[]) {
  if (rows.length === 0) return null
  return {
    reservations: rows.reduce((n, r) => n + r.reservations, 0),
    guests: rows.reduce((n, r) => n + r.guests, 0),
    confirmed: rows.reduce((n, r) => n + r.confirmed, 0),
    cancelled: rows.reduce((n, r) => n + r.cancelled, 0),
    revenue: rows.reduce((n, r) => n + r.revenue, 0),
    forecastRevenue: rows.reduce((n, r) => n + r.forecastRevenue, 0),
    wastagePct: Number((rows.reduce((n, r) => n + r.wastagePct, 0) / rows.length).toFixed(1)),
    staffRequired: rows.reduce((n, r) => Math.max(n, r.staffRequired), 0),
  }
}

const COLUMNS: Record<(typeof REPORT_TYPES)[number], (keyof ReportRow)[]> = {
  Reservations: ['reservations', 'guests', 'confirmed', 'cancelled'],
  Revenue: ['revenue', 'reservations', 'guests'],
  'Food Wastage': ['wastagePct', 'guests', 'reservations'],
  'Staff Requirement': ['staffRequired', 'guests', 'reservations'],
  'Sales Forecast': ['forecastRevenue', 'revenue', 'reservations'],
}

const LABELS: Record<keyof ReportRow, string> = {
  period: 'Period',
  key: 'Key',
  reservations: 'Reservations',
  guests: 'Guests',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  revenue: 'Revenue',
  wastagePct: 'Wastage %',
  staffRequired: 'Staff Required',
  forecastRevenue: 'Forecast Revenue',
}

/* --------------------------------------------------------------- helpers */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** ISO week key so weeks group the same way every time. */
function isoWeekKey(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const day = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 3) // Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000))
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function weekLabel(group: { date: string }[]): string {
  const first = group[0].date
  const last = group[group.length - 1].date
  const f = new Date(`${first}T00:00:00Z`)
  const l = new Date(`${last}T00:00:00Z`)
  const week = isoWeekKey(first).split('-W')[1]
  return `Week ${Number(week)} · ${f.getUTCDate()}–${l.getUTCDate()} ${MONTHS[l.getUTCMonth()].slice(0, 3)}`
}

function csvCell(value: string | number): string {
  const text = typeof value === 'number' ? String(value) : value
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

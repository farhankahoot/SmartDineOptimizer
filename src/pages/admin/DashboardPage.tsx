import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Info,
  Lightbulb,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import {
  FootfallTodayChart,
  ReservationMixChart,
  RevenueTrendChart,
} from '@/components/charts/DashboardCharts'
import { dashboardPeriods, type AlertTone } from '@/data/dashboard'
import { useReservations } from '@/store/ReservationsContext'
import { activeStatuses } from '@/data/reservations'
import { useAuth } from '@/auth/AuthContext'
import { useApi } from '@/lib/useApi'

/* ------------------------------------------------ API response shapes */

interface DashboardPayload {
  kpis: {
    totalReservations: number
    totalReservationsDelta: number | null
    confirmed: number
    confirmedDelta: number | null
    cancelled: number
    cancelledDelta: number | null
    availableTables: number
    bookedTables: number
    blockedTables: number
    guestsHeld: number
    revenue: number
    revenueDelta: number | null
  }
  mix: { name: string; value: number; color: string }[]
  revenueTrend: { day: string; date: string; actual: number; forecast: number }[]
}

interface FootfallPayload {
  footfall: { slot: string; guests: number; reservations: number }[]
}

interface PeakPayload {
  peakHours: {
    slot: string
    booked: number
    capacity: number
    load: number
    tone: 'ok' | 'warn' | 'danger'
    label: string
  }[]
}

interface AlertsPayload {
  alerts: { id: string; tone: AlertTone; category: string; title: string; detail: string }[]
  recommendations: string[]
}

const nf = new Intl.NumberFormat('en-PK')
const pct = (v: number | null) => (v === null ? undefined : `${Math.abs(v)}%`)
const dir = (v: number | null): 'up' | 'down' | 'flat' =>
  v === null || v === 0 ? 'flat' : v > 0 ? 'up' : 'down'

const kpiIcons = [CalendarDays, CheckCircle2, XCircle, TableIcon, TableIcon]

const alertStyles: Record<AlertTone, { icon: typeof Info; ring: string; fg: string }> = {
  danger: { icon: AlertTriangle, ring: 'bg-state-dangerBg', fg: 'text-state-danger' },
  warn: { icon: AlertTriangle, ring: 'bg-[#FDF3DC]', fg: 'text-gold-600' },
  info: { icon: Info, ring: 'bg-state-infoBg', fg: 'text-state-info' },
  success: { icon: CheckCircle2, ring: 'bg-state-successBg', fg: 'text-state-success' },
}

const loadTone = {
  ok: 'bg-state-success',
  warn: 'bg-gold-400',
  danger: 'bg-state-dangerSolid',
}

/**
 * Module 6 — the real-time operational dashboard: KPI cards, footfall and
 * revenue trends, peak-hour insight, alerts and recommendations.
 */
export function DashboardPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { user } = useAuth()
  const { reservations } = useReservations()
  const navigate = useNavigate()

  const [period, setPeriod] = useState('Last 7 days')
  const [refreshing, setRefreshing] = useState(false)

  const summary = useApi<DashboardPayload>('/dashboard', { period })
  const footfall = useApi<FootfallPayload>('/dashboard/footfall')
  const peaks = useApi<PeakPayload>('/dashboard/peak-hours')
  const feed = useApi<AlertsPayload>('/dashboard/alerts')

  const loading = summary.loading || refreshing
  const kpis = summary.data?.kpis
  const alerts = feed.data?.alerts ?? []
  const recommendations = feed.data?.recommendations ?? []

  /** Module 6 FE-1 - the five headline figures, straight from the database. */
  const kpiCards = kpis
    ? [
        { key: 'total', label: 'Total Reservations', value: nf.format(kpis.totalReservations), delta: pct(kpis.totalReservationsDelta), trend: dir(kpis.totalReservationsDelta), caption: period === 'Today' ? 'today' : `in the ${period.toLowerCase()}` },
        { key: 'confirmed', label: 'Confirmed Bookings', value: nf.format(kpis.confirmed), delta: pct(kpis.confirmedDelta), trend: dir(kpis.confirmedDelta), caption: 'vs previous period' },
        { key: 'cancelled', label: 'Cancelled Bookings', value: nf.format(kpis.cancelled), delta: pct(kpis.cancelledDelta), trend: dir(kpis.cancelledDelta), caption: 'vs previous period', invertSentiment: true },
        { key: 'available', label: 'Available Tables', value: nf.format(kpis.availableTables), caption: 'right now' },
        { key: 'booked', label: 'Booked Tables', value: nf.format(kpis.bookedTables), caption: 'right now' },
      ]
    : []

  const pendingCount = useMemo(
    () => reservations.filter((r) => r.status === 'Pending').length,
    [reservations],
  )
  const activeCount = useMemo(
    () => reservations.filter((r) => activeStatuses.includes(r.status)).length,
    [reservations],
  )

  const refresh = async () => {
    setRefreshing(true)
    summary.refresh()
    footfall.refresh()
    peaks.refresh()
    feed.refresh()
    // Brief hold so the skeletons register rather than flashing.
    await new Promise((r) => setTimeout(r, 400))
    setRefreshing(false)
    push({ tone: 'success', title: 'Dashboard refreshed', detail: 'Showing the latest figures.' })
  }

  return (
    <>
      <PageHeader
        title="Real-Time Operations Dashboard"
        underline
        onToggleNav={toggle}
        action={
          <Button
            variant="outline"
            disabled={refreshing}
            leftIcon={<RefreshCw className={cn('size-[14px]', refreshing && 'animate-spin')} />}
            onClick={refresh}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {/* Greeting + period selector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-ink">
              Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              {pendingCount} reservation{pendingCount === 1 ? '' : 's'} awaiting your approval ·{' '}
              {activeCount} active bookings in the system.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[12px] font-semibold text-ink">Period:</span>
            <Select
              aria-label="Dashboard period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-[36px] w-[150px] text-xs"
              options={dashboardPeriods.map((p) => ({ value: p, label: p }))}
            />
          </div>
        </div>

        {/* Module 6 FE-1 — KPI cards */}
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {loading || kpiCards.length === 0
            ? [0, 1, 2, 3, 4].map((k) => <CardSkeleton key={k} />)
            : kpiCards.map((k, i) => {
                const Icon = kpiIcons[i]
                return (
                  <StatCard
                    key={k.key}
                    icon={<Icon />}
                    label={k.label}
                    value={k.value}
                    delta={k.delta}
                    trend={k.trend}
                    invertSentiment={'invertSentiment' in k && k.invertSentiment}
                    caption={k.caption}
                  />
                )
              })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid min-w-0 gap-4">
            {/* Module 6 FE-2 / FE-3 — footfall + revenue */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <SectionTitle icon={<Users className="size-[16px]" strokeWidth={2.3} />}>
                  Customer Footfall by Time Slot
                </SectionTitle>
                <p className="mt-1 text-[11.5px] text-ink-muted">
                  Guests held across live bookings
                </p>
                <div className="mt-3 h-[192px]">
                  {loading || footfall.loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <FootfallTodayChart data={footfall.data?.footfall ?? []} />
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle icon={<CalendarDays className="size-[16px]" strokeWidth={2.3} />}>
                  Revenue Trend &amp; Sales Forecast
                </SectionTitle>
                <p className="mt-1 text-[11.5px] text-ink-muted">
                  {period} · actual vs forecast
                </p>
                <div className="mt-3 h-[192px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <RevenueTrendChart data={summary.data?.revenueTrend ?? []} />
                  )}
                </div>
              </Card>
            </div>

            {/* Module 6 FE-1 mix + FE-4 peak hours */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <SectionTitle icon={<CalendarDays className="size-[16px]" strokeWidth={2.3} />}>
                  Reservation Mix
                </SectionTitle>
                <div className="mt-4">
                  {loading ? (
                    <Skeleton className="h-[132px] w-full" />
                  ) : (
                    <ReservationMixChart data={summary.data?.mix ?? []} />
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle icon={<AlertTriangle className="size-[16px]" strokeWidth={2.3} />}>
                  Peak-Hour Insights
                </SectionTitle>
                <p className="mt-1 text-[11.5px] text-ink-muted">
                  Slot utilisation for the selected day
                </p>

                <ul className="mt-3.5 grid gap-3">
                  {(peaks.data?.peakHours ?? []).map((p) => (
                    <li key={p.slot}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-semibold text-ink">{p.slot}</span>
                        <span className="flex items-center gap-2 text-[11px]">
                          <span className="text-ink-muted">
                            {p.label} · {p.booked}/{p.capacity}
                          </span>
                          <span className="font-bold text-ink">{p.load}%</span>
                        </span>
                      </div>
                      <span className="mt-1.5 block h-[7px] w-full rounded-full bg-line-soft">
                        <span
                          className={cn('block h-full rounded-full', loadTone[p.tone])}
                          style={{ width: `${p.load}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  size="sm"
                  block
                  className="mt-4"
                  rightIcon={<ArrowRight className="size-[13px]" />}
                  onClick={() => navigate('/admin/time-slots')}
                >
                  Manage time slots
                </Button>
              </Card>
            </div>

            {/* Module 6 FE-8 — recommendations */}
            <Card className="p-4">
              <SectionTitle icon={<Lightbulb className="size-[16px]" strokeWidth={2.3} />}>
                Recommendations
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Derived from live bookings, table state and stored forecasts.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {recommendations.map((r, i) => (
                  <li
                    key={r}
                    className="flex gap-2.5 rounded-[9px] border border-line bg-[#FBF9F7] px-3 py-2.5"
                  >
                    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-[12px] leading-snug text-ink-soft">{r}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Module 6 FE-5/FE-6 + Module 8 FE-8 — alert feed */}
          <div className="grid h-fit gap-4">
            <Card className="p-4">
              <SectionTitle
                icon={<Bell className="size-[16px]" strokeWidth={2.3} />}
                action={<Badge tone="pending">{alerts.length} open</Badge>}
              >
                Operational Alerts
              </SectionTitle>

              <ul className="mt-3 grid gap-2">
                {alerts.length === 0 && !feed.loading && (
                  <li className="rounded-[9px] border border-line px-3 py-4 text-center text-[12px] text-ink-muted">
                    Nothing needs attention right now.
                  </li>
                )}
                {alerts.map((a) => {
                  const { icon: Icon, ring, fg } = alertStyles[a.tone]
                  return (
                    <li key={a.id} className="rounded-[9px] border border-line px-3 py-2.5">
                      <div className="flex gap-2.5">
                        <span
                          className={cn(
                            'mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-full',
                            ring,
                            fg,
                          )}
                        >
                          <Icon className="size-[14px]" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[9.5px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                              {a.category}
                            </span>
                            <span className="shrink-0 text-[9.5px] text-ink-faint">Now</span>
                          </div>
                          <p className="mt-0.5 text-[12px] font-bold leading-snug text-ink">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{a.detail}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>

            <Card className="p-4">
              <SectionTitle icon={<ChefHat className="size-[16px]" strokeWidth={2.3} />}>
                Quick Links
              </SectionTitle>
              <ul className="mt-3 grid gap-1.5">
                {[
                  { label: 'Approve pending reservations', to: '/admin/reservations' },
                  { label: 'Check table availability', to: '/admin/tables' },
                  { label: 'Review staff allocation', to: '/admin/staff' },
                  { label: 'Open prediction dashboard', to: '/admin/prediction' },
                  { label: 'Generate a report', to: '/admin/reports' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="focus-ring flex items-center justify-between gap-2 rounded-[8px] px-3 py-2.5 text-[12px] font-semibold text-ink-soft transition hover:bg-line-soft hover:text-brand-700"
                    >
                      {l.label}
                      <ArrowRight className="size-[13px] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

import type { ReactNode } from 'react'
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  LineChart,
  Tag,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { TableIcon } from '@/components/icons/TableIcon'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FootfallTodayChart, RevenueTrendChart } from '@/components/charts/DashboardCharts'
import { dashboardKpis, operationalAlerts, peakHours } from '@/data/dashboard'

/** Chrome that frames a real screen of the product. */
export function BrowserFrame({
  children,
  label = 'smartdine.asianwok.pk/admin',
  className,
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_24px_70px_-24px_rgba(16,15,14,.45)]',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line bg-[#F4F2EF] px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-[9px] rounded-full bg-[#E0685E]" />
          <span className="size-[9px] rounded-full bg-[#E5B454]" />
          <span className="size-[9px] rounded-full bg-[#7FBF5F]" />
        </span>
        <span className="mx-auto max-w-[280px] truncate rounded-[6px] bg-white px-3 py-1 text-[10.5px] text-ink-muted">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

const previewNav = [
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: CalendarDays, label: 'Reservations' },
  { icon: TableIcon, label: 'Tables' },
  { icon: Tag, label: 'Food Deals' },
  { icon: LineChart, label: 'Prediction' },
]

const kpiIcons = [CalendarDays, CheckCircle2, XCircle, TableIcon]

/**
 * A real slice of the operations dashboard — same StatCard, Card, Badge and
 * chart components the console renders, so the marketing page shows the product
 * rather than a mock-up of it.
 */
export function DashboardPreview() {
  return (
    <BrowserFrame>
      <div className="flex bg-page">
        {/* miniature sidebar */}
        <div className="sidebar-fill hidden w-[152px] shrink-0 flex-col gap-1 px-2.5 py-3 sm:flex">
          <div className="mb-2 flex justify-center">
            <span className="text-[13px] font-black tracking-[-0.5px] text-white">
              Asian<span className="text-brand-500">WOK</span>
            </span>
          </div>
          {previewNav.map(({ icon: Icon, label, active }) => (
            <span
              key={label}
              className={cn(
                'flex items-center gap-2 rounded-[7px] px-2.5 py-[7px] text-[11px] font-semibold',
                active ? 'brand-fill-bright text-white' : 'text-white/70',
              )}
            >
              <Icon className="size-[13px] shrink-0" strokeWidth={1.9} />
              {label}
            </span>
          ))}
        </div>

        {/* miniature content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 border-b border-line bg-page px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold text-ink">
                Real-Time Operations Dashboard
              </p>
              <span className="mt-1 block h-[2.5px] w-[62px] rounded-full bg-gold-400" />
            </div>
            <span className="ml-auto flex items-center gap-2">
              <Bell className="size-[15px] text-brand-700" />
              <Badge tone="pending">6 alerts</Badge>
            </span>
          </div>

          <div className="grid gap-3 p-4">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {dashboardKpis.slice(0, 4).map((k, i) => {
                const Icon = kpiIcons[i]
                return (
                  <StatCard
                    key={k.key}
                    icon={<Icon />}
                    label={k.label}
                    value={k.value}
                    delta={k.delta}
                    trend={k.trend}
                    caption={k.caption}
                  />
                )
              })}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="p-3">
                <p className="text-[11.5px] font-bold text-ink">Customer Footfall by Time Slot</p>
                <div className="mt-2 h-[136px]">
                  <FootfallTodayChart />
                </div>
              </Card>
              <Card className="p-3">
                <p className="text-[11.5px] font-bold text-ink">Revenue Trend &amp; Forecast</p>
                <div className="mt-2 h-[136px]">
                  <RevenueTrendChart />
                </div>
              </Card>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="p-3">
                <p className="text-[11.5px] font-bold text-ink">Peak-Hour Insights</p>
                <ul className="mt-2.5 grid gap-2">
                  {peakHours.slice(0, 3).map((p) => (
                    <li key={p.slot}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10.5px] font-semibold text-ink">{p.slot}</span>
                        <span className="text-[10px] font-bold text-ink">{p.load}%</span>
                      </div>
                      <span className="mt-1 block h-[5px] w-full rounded-full bg-line-soft">
                        <span
                          className={cn(
                            'block h-full rounded-full',
                            p.tone === 'danger'
                              ? 'bg-state-dangerSolid'
                              : p.tone === 'warn'
                                ? 'bg-gold-400'
                                : 'bg-state-success',
                          )}
                          style={{ width: `${p.load}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-3">
                <p className="text-[11.5px] font-bold text-ink">Operational Alerts</p>
                <ul className="mt-2.5 grid gap-1.5">
                  {operationalAlerts.slice(0, 3).map((a) => (
                    <li key={a.id} className="rounded-[7px] border border-line px-2.5 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                        {a.category}
                      </p>
                      <p className="mt-0.5 text-[10.5px] font-bold leading-snug text-ink">
                        {a.title}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

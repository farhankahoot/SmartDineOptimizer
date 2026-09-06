import { useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  ChefHat,
  Info,
  Clock,
  DollarSign,
  Fish,
  SlidersHorizontal,
  Soup,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label, Select } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { chart } from '@/components/charts/chartTheme'
import { ChartLegend, ChartPanel } from '@/components/charts/ChartPanel'
import {
  DailySalesChart,
  DemandList,
  ExpectedGuestsChart,
  FoodDemandChart,
  FootfallChart,
  PeakHourHeatmap,
  PredictedVsActualDonut,
  RevenueForecastChart,
  RiskMeter,
  SectionHeading,
  StaffShiftChart,
  WeeklyTrendChart,
} from '@/components/charts/PredictionCharts'
import {
  busiestSlot as fallbackBusiest,
  lowDemanded as fallbackLow,
  mlRecommendations as fallbackRecommendations,
  predictionFilters,
  staffCards as fallbackStaffCards,
  staffGapAlert,
  topDemanded as fallbackTop,
} from '@/data/prediction'
import { useApi } from '@/lib/useApi'
import type {
  DayPoint,
  DemandPoint,
  FootfallPoint,
  RevenuePoint,
  ShiftPoint,
} from '@/components/charts/PredictionCharts'

/**
 * Module 5 FE-7 — the screen renders whatever the prediction service has
 * stored. `model` records what produced the rows: "seed" means they are
 * fixtures, not the output of a trained model, and the banner says so.
 */
/** Module 5 FE-1 to FE-5, reduced to the six headline figures. */
interface SummaryPayload {
  scopeDate: string | null
  predictedRevenue: number | null
  expectedFootfall: number | null
  peakHour: string | null
  staffRequired: number | null
  wastageTargetPct: number
  shortageBufferPct: number
  wastageRisk: 'Low' | 'Medium' | 'High' | null
  wastageAvgPct: number | null
  shortageRisk: 'Low' | 'Medium' | 'High' | null
  servableGuests: number
  seatingCapacity: number
  available: boolean
}

interface PredictionsPayload {
  scopeDate: string | null
  generatedAt: string | null
  model: string | null
  confidence: number | null
  stale: boolean
  settings: {
    footfallModel: string
    revenueModel: string
    trainingWindow: string
    refreshInterval: string
    confidenceThreshold: number
  }
  outputs: {
    revenue?: { hourly: RevenuePoint[] }
    'sales-forecast'?: { daily: DayPoint[] }
    footfall?: {
      hourly: FootfallPoint[]
      byDay: DayPoint[]
      busiestSlot: { range: string; footfall: string }
    }
    'peak-hour'?: {
      busiestSlot: { range: string; footfall: string }
      recommendations: { id: string; text: string; icon: string }[]
    }
    'food-demand'?: {
      demand: DemandPoint[]
      top: { name: string; pct: number }[]
      low: { name: string; pct: number }[]
    }
    staffing?: {
      byShift: ShiftPoint[]
      cards: { label: string; value: number; delta: string; trend: string; icon: string }[]
    }
  }
}

const kpiIcons = {
  dollar: DollarSign,
  users: Users,
  clock: Clock,
  alert: AlertTriangle,
  trash: Trash2,
}

const recIcons: Record<string, typeof Clock> = {
  clock: Clock,
  staff: Users,
  bowl: Soup,
  fish: Fish,
  chart: BarChart3,
}

const staffIcons: Record<string, typeof ChefHat> = {
  chef: ChefHat,
  server: UserRound,
  cleaner: Sparkles,
}

export function PredictionPage() {
  const { toggle } = useMobileNav()
  const [day, setDay] = useState('Sunday')
  const [slot, setSlot] = useState('All Day')
  const [forecast, setForecast] = useState('All')

  const { data, loading } = useApi<PredictionsPayload>('/predictions')
  const { data: summary } = useApi<SummaryPayload>('/predictions/summary')
  const out = data?.outputs ?? {}

  /** How full the meter arc reads for each risk level. */
  const riskTrack = (risk: string | null | undefined) =>
    risk === 'High' ? 0.85 : risk === 'Medium' ? 0.55 : 0.25

  const riskColour = (risk: string | null | undefined) =>
    risk === 'High' ? '#C0392B' : risk === 'Medium' ? '#E8871E' : '#1E5B32'

  const money = (n: number | null | undefined) =>
    n === null || n === undefined ? '—' : `\u20A8 ${Math.round(n).toLocaleString('en-PK')}`

  /**
   * The six headline cards. Every value is computed by the API from stored
   * forecasts, recorded wastage and real seating capacity — an unavailable
   * figure shows an em dash rather than a placeholder number.
   */
  const predictionStats = [
    {
      key: 'revenue',
      label: 'Predicted Revenue',
      value: money(summary?.predictedRevenue),
      caption: summary?.scopeDate ? `Forecast for ${summary.scopeDate}` : 'No forecast stored',
      trend: 'up' as const,
      color: '#7A1113',
      icon: 'dollar' as const,
    },
    {
      key: 'footfall',
      label: 'Expected Footfall',
      value: summary?.expectedFootfall?.toLocaleString('en-PK') ?? '—',
      suffix: 'Guests',
      caption: `Room serves about ${summary?.servableGuests ?? 0}`,
      trend: 'up' as const,
      color: '#7A1113',
      icon: 'users' as const,
    },
    {
      key: 'peak',
      label: 'Peak Hour',
      value: summary?.peakHour ?? '—',
      caption: 'Highest predicted traffic',
      trend: 'warn' as const,
      color: '#FFFFFF',
      icon: 'clock' as const,
    },
    {
      key: 'shortage',
      label: 'Food Shortage Risk',
      value: summary?.shortageRisk ?? '—',
      caption: `Footfall vs capacity +${summary?.shortageBufferPct ?? 0}% buffer`,
      trend: 'warn' as const,
      color: '#E8871E',
      icon: 'alert' as const,
      valueColor: riskColour(summary?.shortageRisk),
    },
    {
      key: 'wastage',
      label: 'Wastage Risk',
      value: summary?.wastageRisk ?? '—',
      caption:
        summary?.wastageAvgPct !== null && summary?.wastageAvgPct !== undefined
          ? `${summary.wastageAvgPct}% recorded vs ${summary.wastageTargetPct}% target`
          : 'No wastage recorded',
      trend: 'down' as const,
      color: '#1E5B32',
      icon: 'trash' as const,
      valueColor: riskColour(summary?.wastageRisk),
    },
    {
      key: 'staff',
      label: 'Staff Requirement',
      value: summary?.staffRequired?.toString() ?? '—',
      suffix: 'Staff',
      caption: 'Across all shifts',
      trend: 'up' as const,
      color: '#7A1113',
      icon: 'users' as const,
    },
  ]

  // Every series falls back to the seeded fixture when that forecast kind has
  // not been generated, so the layout never collapses.
  const revenueSeries = out.revenue?.hourly
  const dailySeries = out['sales-forecast']?.daily
  const footfallSeries = out.footfall?.hourly
  const guestsSeries = out.footfall?.byDay
  const demandSeries = out['food-demand']?.demand
  const topDemanded = out['food-demand']?.top ?? fallbackTop
  const lowDemanded = out['food-demand']?.low ?? fallbackLow
  const shiftSeries = out.staffing?.byShift
  const staffCards = out.staffing?.cards ?? fallbackStaffCards
  const busiestSlot = out['peak-hour']?.busiestSlot ?? out.footfall?.busiestSlot ?? fallbackBusiest
  const mlRecommendations = out['peak-hour']?.recommendations ?? fallbackRecommendations

  /** "seed" means no trained model has written to the table yet. */
  const seeded = !data || data.model === 'seed'

  return (
    <>
      <PageHeader title="Prediction and Analytics Dashboard" onToggleNav={toggle} />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {/*
          LI-6 makes these forecasts decision support only, and nothing here
          should imply a trained model produced them when one has not run.
        */}
        {!loading && (
          <div
            className={cn(
              'flex flex-wrap items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-[11.5px]',
              seeded
                ? 'border-gold-600/40 bg-[#FDF8EC] text-gold-700'
                : 'border-line bg-white text-ink-soft',
            )}
          >
            <Info className="size-[14px] shrink-0" strokeWidth={2.2} />
            {seeded ? (
              <span>
                <b>Reference figures.</b> These forecasts are stored seed data — no model has been
                trained yet, so treat them as a worked example rather than a prediction.
              </span>
            ) : (
              <span>
                Generated by <b>{data?.model}</b>
                {data?.generatedAt
                  ? ` on ${new Date(data.generatedAt).toLocaleString('en-GB')}`
                  : ''}
                {data?.confidence ? ` · confidence ${Math.round(data.confidence * 100)}%` : ''}.
                Decision support only.
              </span>
            )}
            {data?.scopeDate && (
              <span className="ml-auto shrink-0 opacity-80">Forecast for {data.scopeDate}</span>
            )}
          </div>
        )}

        {/* Filter row */}
        <section className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <div>
            <Label>Date</Label>
            <Select
              icon={<CalendarDays />}
              value={data?.scopeDate ?? '—'}
              onChange={() => {}}
              options={[
                { value: data?.scopeDate ?? '—', label: data?.scopeDate ?? 'No forecast stored' },
              ]}
            />
          </div>
          <div>
            <Label>Day</Label>
            <Select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              options={predictionFilters.days.map((d) => ({ value: d, label: d }))}
            />
          </div>
          <div>
            <Label>Time Slot</Label>
            <Select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              options={predictionFilters.timeSlots.map((d) => ({ value: d, label: d }))}
            />
          </div>
          <div>
            <Label>Forecast Type</Label>
            <Select
              value={forecast}
              onChange={(e) => setForecast(e.target.value)}
              options={predictionFilters.forecastTypes.map((d) => ({ value: d, label: d }))}
            />
          </div>
          <Button leftIcon={<SlidersHorizontal className="size-[15px]" />} className="h-[42px]">
            Apply Filters
          </Button>
        </section>

        {/* KPI row */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {predictionStats.map((s) => {
            const Icon = kpiIcons[s.icon]
            return (
              <article
                key={s.key}
                className="flex items-center gap-3 rounded-card border border-line bg-white px-3.5 py-3.5 shadow-card"
              >
                <span
                  className="flex size-[38px] shrink-0 items-center justify-center rounded-full text-white [&>svg]:size-[18px]"
                  style={{ background: s.color === '#FFFFFF' ? 'transparent' : s.color }}
                >
                  {s.key === 'peak' ? (
                    <Icon className="text-brand-700" strokeWidth={2} />
                  ) : (
                    <Icon strokeWidth={2.2} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-bold text-ink">{s.label}</p>
                  <p
                    className="mt-0.5 text-[19px] font-extrabold leading-none"
                    style={{ color: s.valueColor ?? '#1B1B1F' }}
                  >
                    {s.value}
                    {'suffix' in s && s.suffix && (
                      <span className="ml-1 text-[12px] font-semibold text-ink-soft">{s.suffix}</span>
                    )}
                  </p>
                  <p
                    className={cn(
                      'mt-1 flex items-center gap-1 text-[10.5px] font-semibold',
                      s.trend === 'up' && 'text-state-success',
                      s.trend === 'warn' && 'text-[#D9932B]',
                      s.trend === 'down' && 'text-state-success',
                    )}
                  >
                    <span className="text-[8px]">{s.trend === 'down' ? '▼' : '▲'}</span>
                    {s.caption}
                  </p>
                </div>
              </article>
            )
          })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_222px]">
          <div className="grid min-w-0 gap-4">
            {/* 1. Revenue and Sales Forecast */}
            <section className="grid gap-2.5">
              <SectionHeading>1. Revenue and Sales Forecast</SectionHeading>
              <Card className="grid gap-5 p-4 lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_190px]">
                <ChartPanel
                  title="Revenue Forecast (Today)"
                  footer={
                    <ChartLegend
                      items={[
                        { color: chart.maroon, label: 'Predicted Revenue' },
                        { color: chart.goldSoft, label: 'Actual Revenue', dashed: true },
                      ]}
                    />
                  }
                >
                  <RevenueForecastChart data={revenueSeries} />
                </ChartPanel>

                <ChartPanel title="Daily Sales Forecast">
                  <DailySalesChart data={dailySeries} />
                </ChartPanel>

                <ChartPanel title="Weekly Sales Trend">
                  <WeeklyTrendChart />
                </ChartPanel>

                <div className="xl:border-l xl:border-line xl:pl-4">
                  <h3 className="mb-2 text-center text-[12px] font-bold text-ink">
                    Predicted vs Actual
                    <br />
                    Revenue (Today)
                  </h3>
                  <PredictedVsActualDonut />
                </div>
              </Card>
            </section>

            {/* 2. Footfall and Peak Hours */}
            <section className="grid gap-2.5">
              <SectionHeading>2. Footfall and Peak Hours</SectionHeading>
              <Card className="grid gap-5 p-4 lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_190px]">
                <ChartPanel title="Footfall by Time Slot">
                  <FootfallChart data={footfallSeries} />
                </ChartPanel>

                <ChartPanel title="Peak Hour Heatmap" height={168}>
                  <PeakHourHeatmap />
                </ChartPanel>

                <ChartPanel title="Expected Guests by Day">
                  <ExpectedGuestsChart data={guestsSeries} />
                </ChartPanel>

                <div className="flex flex-col items-center justify-center text-center xl:border-l xl:border-line xl:pl-4">
                  <h3 className="text-[12px] font-bold text-brand-700">Busiest Time Slot</h3>
                  <span className="mt-3 flex size-[52px] items-center justify-center rounded-full border-2 border-gold-400 bg-white">
                    <Clock className="size-[28px] text-ink" strokeWidth={1.6} />
                  </span>
                  <p className="mt-3 text-[15px] font-extrabold text-ink">{busiestSlot.range}</p>
                  <p className="mt-2 text-[11px] text-ink-muted">Expected Footfall</p>
                  <p className="mt-1 text-[17px] font-extrabold text-brand-700">{busiestSlot.footfall}</p>
                </div>
              </Card>
            </section>

            {/* 3. Food Management Prediction */}
            <section className="grid gap-2.5">
              <SectionHeading>3. Food Management Prediction</SectionHeading>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_200px_minmax(0,1.4fr)]">
                <Card className="p-4">
                  <ChartPanel title="Predicted Food Demand (Top Items)" height={176}>
                    <FoodDemandChart data={demandSeries} />
                  </ChartPanel>
                  <p className="mt-1 text-center text-[10px] text-ink-muted">Demand Level (%)</p>
                </Card>

                <div className="grid content-start gap-3">
                  <Card className="flex items-center gap-3 p-3.5">
                    <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#E8871E] text-white">
                      <AlertTriangle className="size-[19px]" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-ink">Food Shortage Risk</p>
                      <RiskMeter
                        level={summary?.shortageRisk ?? "—"}
                        color={riskColour(summary?.shortageRisk)}
                        track={riskTrack(summary?.shortageRisk)}
                      />
                      <p className="mt-1.5 text-[10px] text-ink-muted">Monitor &amp; Plan Accordingly</p>
                    </div>
                  </Card>

                  <Card className="flex items-center gap-3 p-3.5">
                    <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#1E5B32] text-white">
                      <Trash2 className="size-[18px]" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-ink">Wastage Risk</p>
                      <RiskMeter
                        level={summary?.wastageRisk ?? "—"}
                        color={riskColour(summary?.wastageRisk)}
                        track={riskTrack(summary?.wastageRisk)}
                      />
                      <p className="mt-1.5 text-[10px] text-ink-muted">Wastage Under Control</p>
                    </div>
                  </Card>
                </div>

                <Card className="grid gap-5 p-4 sm:grid-cols-2">
                  <DemandList title="Top Demanded Categories" items={topDemanded} color={chart.maroon} />
                  <div className="sm:border-l sm:border-line sm:pl-5">
                    <DemandList title="Low-Demand Categories" items={lowDemanded} color={chart.gold} />
                  </div>
                </Card>
              </div>
            </section>

            {/* 4. Employee Requirement Prediction */}
            <section className="grid gap-2.5">
              <SectionHeading>4. Employee Requirement Prediction</SectionHeading>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_195px]">
                <Card className="grid grid-cols-3 divide-x divide-line p-4">
                  {staffCards.map((s) => {
                    const Icon = staffIcons[s.icon] ?? UserRound
                    return (
                      <div key={s.label} className="px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#FBE4E9] text-ink">
                            <Icon className="size-[17px]" strokeWidth={1.8} />
                          </span>
                          <p className="text-left text-[11.5px] font-medium leading-tight text-ink-soft">
                            {s.label.split(' ').slice(0, 1).join(' ')}
                            <br />
                            {s.label.split(' ').slice(1).join(' ')}
                          </p>
                        </div>
                        <p className="mt-2 text-[24px] font-extrabold leading-none text-ink">{s.value}</p>
                        <p
                          className={cn(
                            'mt-2 text-[10.5px] font-semibold',
                            s.trend === 'up' ? 'text-state-success' : 'text-ink-muted',
                          )}
                        >
                          {s.trend === 'up' && <span className="mr-1 text-[8px]">▲</span>}
                          {s.delta}
                        </p>
                      </div>
                    )
                  })}
                </Card>

                <Card className="p-4">
                  <ChartPanel
                    title="Staff Requirement by Shift"
                    height={150}
                    footer={
                      <ChartLegend
                        items={[
                          { color: chart.maroon, label: 'Chefs', shape: 'square' },
                          { color: chart.gold, label: 'Serving Staff', shape: 'square' },
                          { color: chart.grey, label: 'Cleaning Staff', shape: 'square' },
                        ]}
                      />
                    }
                  >
                    <StaffShiftChart data={shiftSeries} />
                  </ChartPanel>
                </Card>

                <Card className="flex flex-col items-center justify-center gap-2 border-state-danger/20 bg-[#FDF1F1] p-4 text-center">
                  <span className="flex items-center gap-2 text-[12.5px] font-bold text-brand-700">
                    <AlertTriangle className="size-[19px] fill-state-dangerSolid text-white" />
                    Staff Gap Alert
                  </span>
                  <p className="mt-1 text-[14px] font-extrabold leading-snug text-brand-700">
                    {staffGapAlert.title}
                  </p>
                  <p className="text-[11.5px] leading-snug text-ink-soft">{staffGapAlert.detail}</p>
                </Card>
              </div>
            </section>
          </div>

          {/* ML recommendations rail */}
          <Card className="h-fit overflow-hidden p-0">
            <div className="brand-fill flex items-center gap-2 px-3 py-2.5">
              <Brain className="size-[16px] text-gold-300" strokeWidth={2} />
              <h2 className="text-[12.5px] font-bold text-white">ML Recommendations</h2>
            </div>

            <ul className="divide-y divide-line-soft px-3">
              {mlRecommendations.map((r) => {
                const Icon = recIcons[r.icon] ?? BarChart3
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3.5">
                    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#FBE4E9] text-ink">
                      <Icon className="size-[16px]" strokeWidth={1.9} />
                    </span>
                    <p className="text-[11.5px] font-medium leading-snug text-ink">{r.text}</p>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-line bg-[#FBF7EF] px-3 py-4 text-center">
              <TrendingUp className="mx-auto size-[26px] text-gold-400" strokeWidth={2} />
              <p className="mt-2 text-[11px] leading-snug text-ink-soft">
                Data-driven decisions for better efficiency and higher profits.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

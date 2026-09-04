import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { axisTick, chart, tooltipStyle } from './chartTheme'
import { footfallToday, reservationMix, revenueTrend } from '@/data/dashboard'

/**
 * The charts take their series as props so the dashboard can pass live figures
 * from the API. The fixtures remain as defaults, which keeps the components
 * renderable in isolation.
 */
export interface FootfallPoint {
  slot: string
  guests: number
}
export interface RevenuePoint {
  day: string
  actual: number | null
  forecast: number
}
export interface MixSlice {
  name: string
  value: number
  color: string
}

/** Module 6 FE-2 — footfall by time slot. */
export function FootfallTodayChart({ data = footfallToday }: { data?: FootfallPoint[] }) {
  // The busiest slot is highlighted, so the threshold follows the data.
  const peak = data.reduce((max, d) => Math.max(max, d.guests), 0)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -20 }} barCategoryGap="30%">
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="slot" tick={axisTick} tickLine={false} axisLine={{ stroke: chart.grid }} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={38} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#F6F4F2' }} formatter={(v: number) => `${v} guests`} />
        <Bar dataKey="guests" name="Guests" radius={[2, 2, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.slot} fill={peak > 0 && d.guests === peak ? chart.gold : chart.maroon} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Module 6 FE-3 — revenue trend with the forecast overlay. */
export function RevenueTrendChart({ data = revenueTrend }: { data?: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -6 }}>
        <defs>
          <linearGradient id="dash-rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chart.areaTop} />
            <stop offset="100%" stopColor={chart.areaBottom} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: chart.grid }} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => `₨${v / 1000}k`}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(v) => (typeof v === 'number' ? `₨${v.toLocaleString()}` : '—')}
        />
        <Legend
          verticalAlign="bottom"
          height={26}
          iconType="plainline"
          wrapperStyle={{ fontSize: 10.5, color: '#3F3F46' }}
        />
        <Area
          type="monotone"
          dataKey="actual"
          name="Actual revenue"
          stroke={chart.maroon}
          strokeWidth={2}
          fill="url(#dash-rev)"
          connectNulls
          dot={{ r: 2.6, fill: chart.maroon, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke={chart.gold}
          strokeWidth={1.8}
          strokeDasharray="5 4"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Module 6 FE-1 — reservation status mix. */
export function ReservationMixChart({ data = reservationMix }: { data?: MixSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={42}
              outerRadius={64}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[17px] font-extrabold leading-none text-ink">
            {total.toLocaleString()}
          </span>
          <span className="mt-0.5 text-[9.5px] text-ink-muted">bookings</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-[11.5px]">
            <span className="size-[9px] shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate text-ink-soft">{d.name}</span>
            <span className="font-bold text-ink">{d.value}</span>
            <span className="w-[38px] text-right text-ink-faint">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

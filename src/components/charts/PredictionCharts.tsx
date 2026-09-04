import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/cn'
import { axisTick, chart, tooltipStyle } from './chartTheme'
import {
  dailySalesForecast,
  expectedGuestsByDay,
  footfallByTimeSlot,
  heatmapDays,
  heatmapHours,
  heatmapValues,
  predictedFoodDemand,
  predictedVsActual,
  revenueForecast,
  staffByShift,
  weeklySalesTrend,
} from '@/data/prediction'

const money = (v: number) => `₨${v / 1000}k`

/* ------------------------------------------- 1. Revenue and Sales Forecast */

export function RevenueForecastChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={revenueForecast} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis
          dataKey="t"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chart.grid }}
          interval={1}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          domain={[0, 8000]}
          ticks={[0, 2000, 4000, 6000, 8000]}
          tickFormatter={(v) => `₨${v / 1000}k`}
          width={44}
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => `₨${v.toLocaleString()}`} />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Predicted Revenue"
          stroke={chart.maroon}
          strokeWidth={2}
          dot={{ r: 2.4, fill: chart.maroon, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual Revenue"
          stroke={chart.goldSoft}
          strokeWidth={1.8}
          strokeDasharray="5 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function DailySalesChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dailySalesForecast} margin={{ top: 6, right: 6, bottom: 0, left: -14 }} barCategoryGap="34%">
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: chart.grid }} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          domain={[0, 20000]}
          ticks={[0, 5000, 10000, 15000, 20000]}
          tickFormatter={money}
          width={44}
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => `₨${v.toLocaleString()}`} cursor={{ fill: '#F6F4F2' }} />
        <Bar dataKey="value" name="Forecast" radius={[2, 2, 0, 0]}>
          {dailySalesForecast.map((d) => (
            <Cell key={d.day} fill={d.highlight ? chart.gold : chart.maroon} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WeeklyTrendChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={weeklySalesTrend} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id="weekly-fill" x1="0" y1="0" x2="0" y2="1">
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
          domain={[0, 40000]}
          ticks={[0, 10000, 20000, 30000, 40000]}
          tickFormatter={money}
          width={44}
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => `₨${v.toLocaleString()}`} />
        <Area
          type="monotone"
          dataKey="value"
          name="Weekly sales"
          stroke={chart.maroon}
          strokeWidth={2}
          fill="url(#weekly-fill)"
          dot={{ r: 2.6, fill: chart.maroon, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function PredictedVsActualDonut() {
  const data = [
    { name: 'Predicted', value: predictedVsActual.predicted, fill: chart.maroon },
    { name: 'Actual', value: predictedVsActual.actual, fill: chart.gold },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[126px] w-[126px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={40}
              outerRadius={62}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              stroke="none"
              // A donut that sweeps in from zero reads as a broken chart on
              // first paint, so this one is drawn complete.
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-extrabold leading-none text-state-success">
            {predictedVsActual.delta}
          </span>
          <span className="mt-0.5 text-[9px] text-ink-muted">{predictedVsActual.caption}</span>
        </div>
      </div>

      <ul className="mt-3 w-full max-w-[170px] space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="size-[10px] shrink-0 rounded-full" style={{ background: d.fill }} />
            <span className="flex-1 text-ink-soft">{d.name}</span>
            <span className="font-bold text-ink">₨{d.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------- 2. Footfall and Peak Hours */

export function FootfallChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={footfallByTimeSlot} margin={{ top: 6, right: 6, bottom: 0, left: -18 }} barCategoryGap="16%">
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis
          dataKey="t"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chart.grid }}
          interval={3}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          domain={[0, 80]}
          ticks={[0, 20, 40, 60, 80]}
          width={38}
        />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#F6F4F2' }} />
        <Bar dataKey="v" name="Guests" fill={chart.maroon} radius={[1.5, 1.5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PeakHourHeatmap() {
  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 grid-cols-[38px_repeat(7,1fr)] gap-[3px]">
        <span />
        {heatmapDays.map((d) => (
          <span key={d} className="pb-1 text-center text-[9px] font-semibold text-ink-muted">
            {d}
          </span>
        ))}

        {heatmapValues.flatMap((row, r) => [
          <span
            key={`h-${r}`}
            className="pr-1 text-right text-[8.5px] font-semibold leading-[16px] text-ink-muted"
          >
            {heatmapHours[r]}
          </span>,
          ...row.map((v, c) => (
            <span
              key={`c-${r}-${c}`}
              title={`${heatmapDays[c]} ${heatmapHours[r]} — ${Math.round(v * 100)}%`}
              className="rounded-[2px]"
              style={{ background: heatColor(v) }}
            />
          )),
        ])}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[9px] text-ink-muted">Low Footfall</span>
        <span
          className="h-[9px] flex-1 rounded-[2px]"
          style={{ backgroundImage: `linear-gradient(90deg, ${heatColor(0.05)}, ${heatColor(1)})` }}
        />
        <span className="text-[9px] text-ink-muted">High Footfall</span>
      </div>
    </div>
  )
}

function heatColor(v: number) {
  // Interpolates the mockup's pale-pink → deep-maroon ramp.
  const from = [253, 240, 238]
  const to = [122, 17, 19]
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * Math.min(1, Math.max(0, v))))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export function ExpectedGuestsChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={expectedGuestsByDay} margin={{ top: 6, right: 6, bottom: 0, left: -18 }} barCategoryGap="38%">
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: chart.grid }} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          domain={[0, 400]}
          ticks={[0, 100, 200, 300, 400]}
          width={38}
        />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#F6F4F2' }} />
        <Bar dataKey="value" name="Guests" radius={[2, 2, 0, 0]}>
          {expectedGuestsByDay.map((d) => (
            <Cell key={d.day} fill={d.highlight ? chart.gold : chart.maroon} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------- 3. Food Management Prediction */

export function FoodDemandChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={predictedFoodDemand}
        layout="vertical"
        margin={{ top: 2, right: 10, bottom: 2, left: 6 }}
        barCategoryGap="26%"
      >
        <CartesianGrid stroke={chart.grid} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chart.grid }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="item"
          tick={{ ...axisTick, fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => `${v}%`} cursor={{ fill: '#F6F4F2' }} />
        <Bar dataKey="value" name="Demand" fill={chart.maroon} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DemandList({
  title,
  items,
  color,
}: {
  title: string
  items: { name: string; pct: number }[]
  color: string
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2.5 text-[12px] font-bold text-ink">{title}</h3>
      <ul className="grid gap-2.5">
        {items.map((i) => (
          <li key={i.name} className="flex items-center gap-3">
            <span className="w-[74px] shrink-0 truncate text-[11px] text-ink-soft">{i.name}</span>
            <span className="h-[7px] flex-1 rounded-full bg-line-soft">
              <span
                className="block h-full rounded-full"
                style={{ width: `${i.pct}%`, background: color }}
              />
            </span>
            <span className="w-[30px] shrink-0 text-right text-[11px] font-bold text-ink">{i.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Risk gauge used for Food Shortage / Wastage. */
export function RiskMeter({
  level,
  color,
  track = 0.55,
}: {
  level: string
  color: string
  track?: number
}) {
  return (
    <div className="w-full">
      <p className="text-[17px] font-extrabold leading-none" style={{ color }}>
        {level}
      </p>
      <span className="mt-2 block h-[5px] w-full rounded-full bg-[#E4E4E8]">
        <span className="block h-full rounded-full" style={{ width: `${track * 100}%`, background: color }} />
      </span>
    </div>
  )
}

/* ------------------------------------------- 4. Employee Requirement */

export function StaffShiftChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={staffByShift} margin={{ top: 6, right: 6, bottom: 0, left: -22 }} barCategoryGap="42%">
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis
          dataKey="shift"
          tick={{ ...axisTick, fontSize: 8.5 }}
          tickLine={false}
          axisLine={{ stroke: chart.grid }}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          domain={[0, 25]}
          ticks={[0, 5, 10, 15, 20]}
          width={36}
        />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#F6F4F2' }} />
        <Bar dataKey="chefs" name="Chefs" stackId="s" fill={chart.maroon} />
        <Bar dataKey="serving" name="Serving Staff" stackId="s" fill={chart.gold} />
        <Bar dataKey="cleaning" name="Cleaning Staff" stackId="s" fill={chart.grey} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SectionHeading({ children, className }: { children: string; className?: string }) {
  return <h2 className={cn('text-[14px] font-bold text-brand-700', className)}>{children}</h2>
}

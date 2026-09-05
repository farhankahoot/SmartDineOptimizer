import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'

export type Trend = 'up' | 'down' | 'flat'

/**
 * The mockups use four different KPI-card treatments. They share one skeleton
 * (icon • label • value • caption) and differ only in how the icon is dressed
 * and where the caption sits, so they live behind a single `variant` prop.
 *
 *  outline  – Admin Reservations: maroon line-icon, delta row underneath
 *  circleUp – Table Management: solid colour circle, uppercase label, bottom accent rule
 *  pastel   – Food Deals: pastel disc + coloured caption
 *  solid    – Communication / Prediction: filled maroon disc, inline delta
 */
export type StatVariant = 'outline' | 'circleUp' | 'pastel' | 'solid'

export interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  suffix?: string
  caption?: string
  delta?: string
  trend?: Trend
  /**
   * Set on metrics where a rise is bad news — cancellations, wastage. The
   * arrow still shows the real direction; only the colour flips, so a 27% jump
   * in cancellations does not read as a success.
   */
  invertSentiment?: boolean
  variant?: StatVariant
  /** Base hue for circleUp / pastel variants. */
  color?: string
  valueClassName?: string
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  suffix,
  caption,
  delta,
  trend = 'up',
  invertSentiment = false,
  variant = 'outline',
  color = '#7A1113',
  valueClassName,
  className,
}: StatCardProps) {
  // Direction drives the arrow; sentiment drives the colour.
  const good = invertSentiment ? trend === 'down' : trend === 'up'
  const trendColor =
    trend === 'flat' ? 'text-ink-muted' : good ? 'text-state-success' : 'text-state-danger'
  const TrendIcon = trend === 'down' ? ArrowDown : ArrowUp

  if (variant === 'circleUp') {
    return (
      <article
        className={cn(
          'relative flex flex-col overflow-hidden rounded-card border border-line bg-white px-4 pb-4 pt-4 shadow-card',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-[38px] shrink-0 items-center justify-center rounded-full text-white [&>svg]:size-[19px]"
            style={{ background: color }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-ink-soft">
              {label}
            </p>
            <p className={cn('mt-0.5 text-[24px] font-extrabold leading-none text-ink', valueClassName)}>
              {value}
            </p>
          </div>
        </div>
        {caption && <p className="ml-[50px] mt-2.5 text-[11.5px] text-ink-muted">{caption}</p>}
        <span
          className="absolute inset-x-4 bottom-0 h-[2.5px] rounded-full"
          style={{ background: color, opacity: 0.85 }}
        />
      </article>
    )
  }

  if (variant === 'pastel') {
    return (
      <article
        className={cn(
          'flex items-center gap-3.5 rounded-card border border-line bg-white px-4 py-4 shadow-card',
          className,
        )}
      >
        <span
          className="flex size-[44px] shrink-0 items-center justify-center rounded-full [&>svg]:size-[21px]"
          style={{ background: `${color}1F`, color }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-ink-soft">{label}</p>
          <p className={cn('mt-0.5 text-[24px] font-extrabold leading-none text-ink', valueClassName)}>
            {value}
          </p>
          {caption && (
            <p className="mt-1.5 text-[11.5px] font-medium" style={{ color }}>
              {caption}
            </p>
          )}
        </div>
      </article>
    )
  }

  if (variant === 'solid') {
    return (
      <article
        className={cn(
          'flex items-center gap-3.5 rounded-card border border-line bg-white px-4 py-3.5 shadow-card',
          className,
        )}
      >
        <span
          className="flex size-[40px] shrink-0 items-center justify-center rounded-full text-white [&>svg]:size-[19px]"
          style={{ background: color }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-ink">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className={cn('text-[22px] font-extrabold leading-none text-ink', valueClassName)}>
              {value}
              {suffix && <span className="ml-1 text-[13px] font-semibold text-ink-soft">{suffix}</span>}
            </p>
            {delta && (
              <span className={cn('flex items-center gap-0.5 text-[11px] font-bold', trendColor)}>
                <TrendIcon className="size-[11px]" strokeWidth={2.8} />
                {delta}
              </span>
            )}
          </div>
          {caption && <p className="mt-0.5 text-[10.5px] text-ink-faint">{caption}</p>}
        </div>
      </article>
    )
  }

  // outline (default)
  return (
    <article
      className={cn(
        'rounded-card border border-line bg-white px-4 py-3.5 shadow-card',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-brand-700 [&>svg]:size-[26px] [&>svg]:stroke-[1.6]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-ink-soft">{label}</p>
          <p className={cn('mt-1 text-[26px] font-extrabold leading-none text-ink', valueClassName)}>
            {value}
          </p>
        </div>
      </div>
      {(delta || caption) && (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px]">
          {delta && (
            <span className={cn('flex items-center gap-1 font-bold', trendColor)}>
              <TrendIcon className="size-[12px]" strokeWidth={2.8} />
              {delta}
            </span>
          )}
          {caption && <span className="text-ink-muted">{caption}</span>}
        </p>
      )}
    </article>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Titled chart slot used inside every numbered section of the Prediction dashboard. */
export function ChartPanel({
  title,
  height = 168,
  children,
  footer,
  className,
}: {
  title?: string
  height?: number
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {title && <h3 className="mb-2 text-[12px] font-bold text-ink">{title}</h3>}
      <div style={{ height }}>{children}</div>
      {footer}
    </div>
  )
}

export function ChartLegend({
  items,
}: {
  items: { color: string; label: string; dashed?: boolean; shape?: 'line' | 'dot' | 'square' }[]
}) {
  return (
    <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-[10.5px] text-ink-soft">
          {i.shape === 'dot' ? (
            <span className="size-[9px] rounded-full" style={{ background: i.color }} />
          ) : i.shape === 'square' ? (
            <span className="size-[9px] rounded-[2px]" style={{ background: i.color }} />
          ) : (
            <span
              className="h-[2px] w-[18px] rounded-full"
              style={
                i.dashed
                  ? { backgroundImage: `repeating-linear-gradient(90deg, ${i.color} 0 4px, transparent 4px 7px)` }
                  : { background: i.color }
              }
            />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  )
}

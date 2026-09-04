import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

/** Underlined tab strip used by Reservations (list/history) and Settings. */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-line no-scrollbar', className)} role="tablist">
      {items.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'focus-ring relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-semibold transition',
              active ? 'text-brand-700' : 'text-ink-muted hover:text-ink',
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-bold',
                  active ? 'bg-brand-50 text-brand-700' : 'bg-line-soft text-ink-muted',
                )}
              >
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-full bg-brand-700" />}
          </button>
        )
      })}
    </div>
  )
}

/** Vertical tab rail used by the Settings screen on desktop. */
export function SideTabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible" role="tablist">
      {items.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'focus-ring flex shrink-0 items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[12.5px] font-semibold transition',
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-soft hover:bg-line-soft hover:text-ink',
            )}
          >
            {t.icon}
            <span className="whitespace-nowrap">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

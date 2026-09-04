import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/** Shared empty state — "No reservations found", "No data available", … */
export function EmptyState({
  icon,
  title,
  detail,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  detail?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2.5 px-6 py-14 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon ?? <Inbox className="size-6" strokeWidth={1.7} />}
      </span>
      <h3 className="text-[14px] font-bold text-ink">{title}</h3>
      {detail && <p className="max-w-[360px] text-[12.5px] text-ink-muted">{detail}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  )
}

/** Shared error state with a retry affordance. */
export function ErrorState({
  title = 'Something went wrong',
  detail = 'We could not load this data. Please try again.',
  onRetry,
  className,
}: {
  title?: string
  detail?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2.5 px-6 py-14 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-state-dangerBg text-state-danger">
        <AlertTriangle className="size-6" strokeWidth={1.8} />
      </span>
      <h3 className="text-[14px] font-bold text-ink">{title}</h3>
      <p className="max-w-[360px] text-[12.5px] text-ink-muted">{detail}</p>
      {onRetry && (
        <Button size="sm" className="mt-1.5" leftIcon={<RotateCw className="size-[13px] " />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded-[6px] bg-line-soft', className)} />
}

/** Placeholder rows shown while a table's data is in flight. */
export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line-soft" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3', c === 0 ? 'w-[130px]' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-card border border-line bg-white p-4 shadow-card', className)}>
      <Skeleton className="h-3 w-[45%]" />
      <Skeleton className="mt-3 h-6 w-[30%]" />
      <Skeleton className="mt-3 h-2.5 w-[60%]" />
    </div>
  )
}

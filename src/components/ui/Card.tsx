import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // `min-w-0` keeps a wide table inside its grid track instead of pushing the
      // layout wider than the column it was given.
      className={cn('min-w-0 rounded-card border border-line bg-white shadow-card', className)}
      {...rest}
    />
  )
}

/**
 * Numbered section heading used across the admin modules —
 * "1. TABLE MANAGEMENT", "2) Message Templates", "1. Food Deals Management".
 */
export function SectionTitle({
  icon,
  children,
  uppercase,
  action,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  uppercase?: boolean
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2
        className={cn(
          'flex items-center gap-2 font-bold text-brand-700',
          uppercase ? 'text-[13px] uppercase tracking-[0.03em]' : 'text-[15px]',
        )}
      >
        {icon}
        {children}
      </h2>
      {action}
    </div>
  )
}

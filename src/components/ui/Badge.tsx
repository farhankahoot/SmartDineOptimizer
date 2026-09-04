import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'inProgress'
  | 'accepted'
  | 'neutral'
  | 'open'
  | 'full'
  | 'almostFull'
  | 'closed'
  | 'blocked'
  | 'active'
  | 'inactive'
  | 'selected'

const tones: Record<BadgeTone, string> = {
  pending: 'bg-state-warnBg text-state-warn',
  confirmed: 'bg-state-successBg text-state-success',
  cancelled: 'bg-state-dangerBg text-state-danger',
  completed: 'bg-state-infoBg text-state-info',
  inProgress: 'bg-state-infoBg text-state-info',
  accepted: 'bg-state-successBg text-state-success',
  neutral: 'bg-state-neutralBg text-state-neutral',
  open: 'bg-state-successBg text-state-success',
  full: 'bg-state-dangerBg text-state-danger',
  almostFull: 'bg-state-warnBg text-state-warn',
  closed: 'bg-state-neutralBg text-state-neutral',
  blocked: 'bg-[#D9D9DD] text-[#4B5058]',
  active: 'bg-state-successBg text-state-success',
  inactive: 'bg-state-neutralBg text-[#4B5058]',
  selected: 'bg-gold-100 text-gold-600',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[6px] px-2.5 py-[3px] text-[11px] font-semibold leading-4',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Coloured dot + label — the "Delivery Status" column in the Communication module. */
export function DotStatus({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span className="size-[7px] rounded-full" style={{ background: color }} />
      {children}
    </span>
  )
}

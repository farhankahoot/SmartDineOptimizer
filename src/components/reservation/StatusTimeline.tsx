import {
  CalendarPlus,
  CheckCircle2,
  CircleSlash,
  Clock,
  PencilLine,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import type { ReservationStatus, StatusEvent } from '@/data/reservations'

export const statusTone: Record<ReservationStatus, BadgeTone> = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Updated: 'inProgress',
  Rejected: 'cancelled',
  Cancelled: 'cancelled',
  Completed: 'completed',
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>
}

const icons: Record<StatusEvent['status'], typeof Clock> = {
  Submitted: CalendarPlus,
  Pending: Clock,
  Confirmed: CheckCircle2,
  Updated: PencilLine,
  Rejected: CircleSlash,
  Cancelled: XCircle,
  Completed: CheckCircle2,
}

const colors: Record<StatusEvent['status'], string> = {
  Submitted: 'border-ink-faint text-ink-muted',
  Pending: 'border-gold-400 text-gold-600',
  Confirmed: 'border-state-success text-state-success',
  Updated: 'border-state-info text-state-info',
  Rejected: 'border-state-danger text-state-danger',
  Cancelled: 'border-state-danger text-state-danger',
  Completed: 'border-state-info text-state-info',
}

/** Module 1 FE-6 / Module 2 FE-5 — the audit trail of a single booking. */
export function StatusTimeline({ events }: { events: StatusEvent[] }) {
  return (
    <ol className="relative">
      {events.map((e, i) => {
        const Icon = icons[e.status]
        const last = i === events.length - 1
        return (
          <li key={`${e.status}-${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span className="absolute left-[13px] top-[28px] h-[calc(100%-22px)] w-px bg-line" />
            )}
            <span
              className={cn(
                'relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full border-2 bg-white',
                colors[e.status],
              )}
            >
              <Icon className="size-[14px]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-[12.5px] font-bold text-ink">{e.status}</p>
                <p className="text-[11px] text-ink-faint">{e.at}</p>
              </div>
              {e.note && <p className="mt-0.5 text-[11.5px] text-ink-muted">{e.note}</p>}
              <p className="mt-0.5 text-[10.5px] text-ink-faint">by {e.by}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

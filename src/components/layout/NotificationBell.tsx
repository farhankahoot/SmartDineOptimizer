import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApi } from '@/lib/useApi'
import { useAuth } from '@/auth/AuthContext'

type Tone = 'danger' | 'warn' | 'info' | 'success'

interface AlertsPayload {
  alerts: { id: string; tone: Tone; category: string; title: string; detail: string }[]
}

/** Where each alert category is acted on. */
const DESTINATION: Record<string, string> = {
  'Peak hour': '/admin/time-slots',
  Reservations: '/admin/reservations',
  Tables: '/admin/tables',
  Food: '/admin/food-deals',
  Staffing: '/admin/staff',
}

const TONE: Record<Tone, { icon: typeof Info; ring: string; fg: string }> = {
  danger: { icon: AlertTriangle, ring: 'bg-state-dangerBg', fg: 'text-state-danger' },
  warn: { icon: AlertTriangle, ring: 'bg-[#FDF3DC]', fg: 'text-gold-600' },
  info: { icon: Info, ring: 'bg-state-infoBg', fg: 'text-state-info' },
  success: { icon: CheckCircle2, ring: 'bg-state-successBg', fg: 'text-state-success' },
}

/**
 * The console's notification bell.
 *
 * The count used to be a number typed into each page — 8 on Communication, 12
 * on Food Deals, 3 on Staff — and the button did nothing at all. It now shows
 * the operational alerts the dashboard derives, so the badge means something,
 * and each row navigates to the screen where that alert is dealt with.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Only fetched for a signed-in user; every console role may read alerts.
  const { data, refresh } = useApi<AlertsPayload>(user ? '/dashboard/alerts' : null)
  const alerts = data?.alerts ?? []

  // Anything needing action drives the badge; "all clear" notes do not.
  const actionable = alerts.filter((a) => a.tone === 'danger' || a.tone === 'warn')

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${actionable.length ? `, ${actionable.length} needing attention` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) refresh()
        }}
        className={cn(
          'focus-ring relative rounded-lg p-1.5 text-brand-700 transition hover:bg-brand-50',
          open && 'bg-brand-50',
        )}
      >
        <Bell className="size-[19px]" strokeWidth={1.9} />
        {actionable.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-state-dangerSolid px-1 text-[9px] font-bold leading-[15px] text-white">
            {actionable.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+10px)] z-30 w-[330px] animate-scale-in overflow-hidden rounded-[12px] border border-line bg-white shadow-pop"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-[12.5px] font-bold text-ink">Operational alerts</p>
            <span className="text-[11px] text-ink-muted">
              {actionable.length > 0 ? `${actionable.length} need attention` : 'All clear'}
            </span>
          </div>

          <ul className="max-h-[340px] overflow-y-auto">
            {alerts.length === 0 && (
              <li className="px-4 py-8 text-center text-[12px] text-ink-muted">
                Nothing needs attention right now.
              </li>
            )}

            {alerts.map((a) => {
              const { icon: Icon, ring, fg } = TONE[a.tone] ?? TONE.info
              const to = DESTINATION[a.category]
              return (
                <li key={a.id} className="border-b border-line-soft last:border-b-0">
                  <button
                    type="button"
                    disabled={!to}
                    onClick={() => {
                      setOpen(false)
                      if (to) navigate(to)
                    }}
                    className={cn(
                      'flex w-full gap-2.5 px-4 py-3 text-left transition',
                      to ? 'cursor-pointer hover:bg-[#FBF9F7]' : 'cursor-default',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-full',
                        ring,
                        fg,
                      )}
                    >
                      <Icon className="size-[14px]" strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                        {a.category}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-bold leading-snug text-ink">
                        {a.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">
                        {a.detail}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/admin')
            }}
            className="block w-full border-t border-line px-4 py-2.5 text-center text-[12px] font-bold text-brand-700 transition hover:bg-brand-50"
          >
            Open the dashboard
          </button>
        </div>
      )}
    </div>
  )
}

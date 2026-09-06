import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Bell, CheckCheck, Info, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { usePlatform } from '@/store/PlatformContext'
import type { NotificationTone } from '@/data/platform'

const toneStyles: Record<NotificationTone, { ring: string; icon: typeof Info }> = {
  info: { ring: 'bg-state-infoBg text-state-info', icon: Info },
  warning: { ring: 'bg-[#FDF3DC] text-gold-600', icon: AlertTriangle },
  danger: { ring: 'bg-state-dangerBg text-state-danger', icon: AlertTriangle },
  success: { ring: 'bg-state-successBg text-state-success', icon: CheckCheck },
}

/** Platform events that need an administrator's attention. */
export function NotificationsPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = usePlatform()

  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const visible = useMemo(
    () => (tab === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [notifications, tab],
  )

  return (
    <>
      <PageHeader
        title="Notifications"
        underline
        onToggleNav={toggle}
        action={
          <Button
            variant="outline"
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck className="size-[15px]" />}
            onClick={() => {
              markAllRead()
              push({ tone: 'success', title: 'All notifications marked as read' })
            }}
          >
            Mark all read
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <Card className="overflow-hidden">
          <Tabs
            className="px-2 pt-1"
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            items={[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
            ]}
          />

          {visible.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-6" strokeWidth={1.7} />}
              title={tab === 'unread' ? 'Nothing unread' : 'No notifications'}
              detail={
                tab === 'unread'
                  ? 'You are up to date — every platform event has been reviewed.'
                  : 'Platform events such as pending approvals and system warnings appear here.'
              }
            />
          ) : (
            <ul className="divide-y divide-line-soft">
              {visible.map((n) => {
                const { ring, icon: Icon } = toneStyles[n.tone]
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3.5 transition',
                      !n.read && 'bg-brand-50/35',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                        ring,
                      )}
                    >
                      <Icon className="size-[17px]" strokeWidth={2.1} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink">
                        {n.title}
                        {!n.read && <Badge tone="pending">New</Badge>}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{n.detail}</p>
                      <p className="mt-1.5 text-[10.5px] text-ink-faint">{n.at}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {n.to && (
                        <Link to={n.to} onClick={() => markRead(n.id)}>
                          <Button
                            size="xs"
                            variant="outline"
                            rightIcon={<ArrowRight className="size-[11px]" />}
                          >
                            Open
                          </Button>
                        </Link>
                      )}
                      {!n.read && (
                        <Button size="xs" variant="outlineNeutral" onClick={() => markRead(n.id)}>
                          Mark read
                        </Button>
                      )}
                      <button
                        type="button"
                        aria-label={`Dismiss ${n.title}`}
                        onClick={() => dismiss(n.id)}
                        className="focus-ring rounded p-1 text-ink-faint transition hover:text-ink"
                      >
                        <X className="size-[14px]" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <p className="text-center text-[11.5px] text-ink-muted">
          Notifications are generated in the browser for this build. A server would push them from{' '}
          <code className="rounded bg-line-soft px-1">GET /admin/notifications</code>.
        </p>
      </div>
    </>
  )
}

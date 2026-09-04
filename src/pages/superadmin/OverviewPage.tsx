import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleSlash,
  Clock,
  Gauge,
  Info,
  ShieldCheck,
  Store,
  UserPlus,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/auth/AuthContext'
import { useUsers } from '@/store/UsersContext'
import { usePlatform } from '@/store/PlatformContext'
import { useSystem } from '@/store/SystemContext'
import { useReservations } from '@/store/ReservationsContext'
import type { HealthState } from '@/data/platform'
import { useApi } from '@/lib/useApi'

interface HealthPayload {
  checks: { id: string; name: string; state: HealthState; detail: string }[]
}
import { roleLabels } from '@/data/users'

const toneStyles = {
  info: 'bg-state-infoBg text-state-info',
  warning: 'bg-[#FDF3DC] text-gold-600',
  danger: 'bg-state-dangerBg text-state-danger',
  success: 'bg-state-successBg text-state-success',
}

/** Platform-wide overview: people, restaurants, system posture and pending work. */
export function SuperOverviewPage() {
  const { toggle } = useMobileNav()
  const { user } = useAuth()
  const { users } = useUsers()
  const { restaurants, notifications, audit, sessions, flags, unreadCount } = usePlatform()
  const { system } = useSystem()
  const { reservations } = useReservations()

  const activeUsers = users.filter((u) => u.status === 'Active').length
  const blockedUsers = users.filter((u) => u.status === 'Suspended').length
  const invitedUsers = users.filter((u) => u.status === 'Invited').length

  const activeRestaurants = restaurants.filter((r) => r.status === 'Active').length
  const pendingRestaurants = restaurants.filter((r) => r.status === 'Pending').length
  const suspendedRestaurants = restaurants.filter(
    (r) => r.status === 'Suspended' || r.status === 'Inactive',
  ).length

  const pendingReservations = reservations.filter((r) => r.status === 'Pending').length
  const disabledFlags = flags.filter((f) => !f.enabled)
  // Component states come from the server's own probes, not a fixed list.
  const { data: health } = useApi<HealthPayload>('/platform/health')
  const healthChecks = health?.checks ?? []
  const degraded = healthChecks.filter((h) => h.state !== 'Operational')

  const restrictions = [
    system.maintenanceMode && 'Public site offline',
    system.adminOnlyLogin && 'Admins-only sign-in',
    system.readOnlyMode && 'Read-only mode',
    !system.publicBookingEnabled && 'Booking form closed',
    !system.trackingEnabled && 'Tracker closed',
  ].filter(Boolean) as string[]

  const pendingActions = [
    pendingRestaurants > 0 && {
      label: `${pendingRestaurants} restaurant${pendingRestaurants === 1 ? '' : 's'} awaiting approval`,
      to: '/superadmin/restaurants',
    },
    invitedUsers > 0 && {
      label: `${invitedUsers} invitation${invitedUsers === 1 ? '' : 's'} not accepted`,
      to: '/superadmin/users',
    },
    pendingReservations > 0 && {
      label: `${pendingReservations} reservation${pendingReservations === 1 ? '' : 's'} pending approval`,
      to: '/admin/reservations',
    },
    disabledFlags.length > 0 && {
      label: `${disabledFlags.length} feature${disabledFlags.length === 1 ? '' : 's'} disabled`,
      to: '/superadmin/system',
    },
    degraded.length > 0 && {
      label: `${degraded.length} service${degraded.length === 1 ? '' : 's'} not fully configured`,
      to: '/superadmin/health',
    },
  ].filter(Boolean) as { label: string; to: string }[]

  return (
    <>
      <PageHeader
        title="Platform Control Centre"
        underline
        notificationCount={unreadCount}
        profileName={user?.name ?? 'Super Admin'}
        profileRole={user ? roleLabels[user.role] : 'Super Admin'}
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {restrictions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-state-danger/25 bg-state-dangerBg px-4 py-3">
            <AlertTriangle className="size-[17px] shrink-0 text-state-danger" />
            <p className="text-[12.5px] font-bold text-ink">Platform restrictions are active:</p>
            {restrictions.map((r) => (
              <Badge key={r} tone="cancelled">
                {r}
              </Badge>
            ))}
            <Link to="/superadmin/system" className="ml-auto">
              <Button size="xs" variant="outline">
                Review
              </Button>
            </Link>
          </div>
        )}

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard variant="circleUp" color="#7A1113" icon={<Users />} label="Total Users" value={String(users.length)} caption="Console accounts" />
          <StatCard variant="circleUp" color="#2E7D32" icon={<CheckCircle2 />} label="Active Users" value={String(activeUsers)} caption="Can sign in now" />
          <StatCard variant="circleUp" color="#C0392B" icon={<CircleSlash />} label="Blocked Users" value={String(blockedUsers)} caption="Refused at sign-in" />
          <StatCard variant="circleUp" color="#C99A3E" icon={<Building2 />} label="Restaurants" value={String(restaurants.length)} caption="In the directory" />
          <StatCard variant="circleUp" color="#1B62B5" icon={<Store />} label="Live in Showcase" value={String(activeRestaurants)} caption="Visible publicly" />
          <StatCard variant="circleUp" color="#E4572E" icon={<Clock />} label="Pending Review" value={String(pendingRestaurants + invitedUsers)} caption="Awaiting an admin" />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="grid min-w-0 gap-4">
            {/* Pending admin actions */}
            <Card className="p-4">
              <SectionTitle icon={<AlertTriangle className="size-[16px]" strokeWidth={2.3} />}>
                Pending Admin Actions
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Everything currently waiting on a decision from you.
              </p>

              {pendingActions.length === 0 ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-[9px] border border-state-success/25 bg-[#F1F9F3] px-3.5 py-3">
                  <CheckCircle2 className="size-[16px] text-state-success" />
                  <p className="text-[12.5px] text-ink-soft">Nothing is waiting — the platform is clear.</p>
                </div>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {pendingActions.map((a) => (
                    <li key={a.label}>
                      <Link
                        to={a.to}
                        className="focus-ring flex items-center gap-3 rounded-[9px] border border-line px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
                      >
                        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#FDF3DC] text-gold-600">
                          <Clock className="size-[14px]" strokeWidth={2.2} />
                        </span>
                        <span className="flex-1 text-[12.5px] font-semibold text-ink">{a.label}</span>
                        <ArrowRight className="size-[14px] shrink-0 text-ink-faint" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Directory + user breakdown */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <SectionTitle icon={<Building2 className="size-[16px]" strokeWidth={2.3} />}>
                  Restaurant Directory
                </SectionTitle>
                <dl className="mt-3 grid gap-2">
                  {(
                    [
                      { label: 'Active', count: activeRestaurants, tone: 'confirmed' },
                      { label: 'Pending approval', count: pendingRestaurants, tone: 'pending' },
                      { label: 'Suspended / inactive', count: suspendedRestaurants, tone: 'cancelled' },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 rounded-[9px] bg-[#FBF9F7] px-3.5 py-2.5"
                    >
                      <dt className="text-[12px] text-ink-soft">{row.label}</dt>
                      <dd>
                        <Badge tone={row.tone}>{row.count}</Badge>
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link to="/superadmin/restaurants" className="mt-3 block">
                  <Button variant="outline" size="sm" block rightIcon={<ArrowRight className="size-[13px]" />}>
                    Manage restaurants
                  </Button>
                </Link>
              </Card>

              <Card className="p-4">
                <SectionTitle icon={<Users className="size-[16px]" strokeWidth={2.3} />}>
                  Users by Role
                </SectionTitle>
                <ul className="mt-3 grid gap-2">
                  {(Object.keys(roleLabels) as (keyof typeof roleLabels)[]).map((role) => {
                    const count = users.filter((u) => u.role === role).length
                    return (
                      <li
                        key={role}
                        className="flex items-center justify-between gap-3 rounded-[9px] bg-[#FBF9F7] px-3.5 py-2.5"
                      >
                        <span className="text-[12px] text-ink-soft">{roleLabels[role]}</span>
                        <span className="text-[12.5px] font-bold text-ink">{count}</span>
                      </li>
                    )
                  })}
                </ul>
                <Link to="/superadmin/users" className="mt-3 block">
                  <Button variant="outline" size="sm" block rightIcon={<ArrowRight className="size-[13px]" />}>
                    Manage users
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Recent platform activity */}
            <Card className="p-4">
              <SectionTitle
                icon={<ShieldCheck className="size-[16px]" strokeWidth={2.3} />}
                action={
                  <Link to="/superadmin/audit">
                    <Button size="xs" variant="outline" rightIcon={<ArrowRight className="size-[11px]" />}>
                      Full audit log
                    </Button>
                  </Link>
                }
              >
                Recent Platform Activity
              </SectionTitle>

              <ul className="mt-3 divide-y divide-line-soft">
                {audit.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <span className="text-[12px] font-semibold text-ink">{a.action}</span>
                    <span className="text-[12px] text-ink-muted">{a.target}</span>
                    <Badge tone={a.result === 'Success' ? 'confirmed' : 'cancelled'}>{a.result}</Badge>
                    <span className="ml-auto text-[10.5px] text-ink-faint">
                      {a.actor} · {a.at}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Right rail */}
          <div className="grid h-fit gap-4">
            <Card className="p-4">
              <SectionTitle
                icon={<Info className="size-[16px]" strokeWidth={2.3} />}
                action={unreadCount > 0 ? <Badge tone="pending">{unreadCount} new</Badge> : undefined}
              >
                Platform Alerts
              </SectionTitle>

              <ul className="mt-3 grid gap-2">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id}>
                    <Link
                      to={n.to ?? '/superadmin/notifications'}
                      className={cn(
                        'focus-ring block rounded-[9px] border px-3 py-2.5 transition hover:bg-line-soft/50',
                        n.read ? 'border-line' : 'border-brand-200 bg-brand-50/40',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-0.5 flex size-[24px] shrink-0 items-center justify-center rounded-full',
                            toneStyles[n.tone],
                          )}
                        >
                          <AlertTriangle className="size-[13px]" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold leading-snug text-ink">{n.title}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{n.detail}</p>
                          <p className="mt-1 text-[10px] text-ink-faint">{n.at}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link to="/superadmin/notifications" className="mt-3 block">
                <Button variant="outline" size="sm" block>
                  View all notifications
                </Button>
              </Link>
            </Card>

            <Card className="p-4">
              <SectionTitle icon={<Gauge className="size-[16px]" strokeWidth={2.3} />}>
                System Snapshot
              </SectionTitle>

              <ul className="mt-3 grid gap-2">
                {healthChecks.slice(0, 5).map((h) => (
                  <li key={h.id} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'size-[8px] shrink-0 rounded-full',
                        h.state === 'Operational'
                          ? 'bg-state-success'
                          : h.state === 'Degraded'
                            ? 'bg-gold-400'
                            : 'bg-ink-faint',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">{h.name}</span>
                    <span className="shrink-0 text-[10.5px] text-ink-muted">{h.state}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-[9px] bg-[#FBF9F7] px-3 py-2.5">
                <p className="text-[11px] leading-snug text-ink-muted">
                  <span className="font-bold text-ink">{sessions.length} active session</span>
                  {sessions.length === 1 ? '' : 's'} across the platform.
                </p>
              </div>

              <Link to="/superadmin/health" className="mt-3 block">
                <Button variant="outline" size="sm" block>
                  System health
                </Button>
              </Link>
            </Card>

            <Card className="p-4">
              <SectionTitle icon={<UserPlus className="size-[16px]" strokeWidth={2.3} />}>
                Quick Actions
              </SectionTitle>
              <ul className="mt-3 grid gap-1.5">
                {[
                  { label: 'Invite a user', to: '/superadmin/users' },
                  { label: 'Add a restaurant', to: '/superadmin/showcase' },
                  { label: 'Edit landing page', to: '/superadmin/content' },
                  { label: 'Feature flags', to: '/superadmin/system' },
                  { label: 'Review sessions', to: '/superadmin/security' },
                ].map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      className="focus-ring flex items-center justify-between gap-2 rounded-[8px] px-3 py-2.5 text-[12px] font-semibold text-ink-soft transition hover:bg-line-soft hover:text-brand-700"
                    >
                      {l.label}
                      <ArrowRight className="size-[13px] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

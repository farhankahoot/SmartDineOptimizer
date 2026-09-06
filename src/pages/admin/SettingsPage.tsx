import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  Bell,
  Brain,
  Building2,
  CalendarClock,
  Check,
  Database,
  Download,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { FieldError, Input, Label, Select, Textarea, Toggle } from '@/components/ui/Field'
import { SideTabs } from '@/components/ui/Tabs'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { useAuth } from '@/auth/AuthContext'
import {
  currencies,
  cuisines,
  defaultHours,
  defaultPrediction,
  defaultProfile,
  defaultRules,
  models,
  refreshIntervals,
  timeOptions,
  timezones,
  trainingWindows,
  type DayHours,
} from '@/data/settings'
import { api, messageOf } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface SettingsPayload {
  profile: typeof defaultProfile
  hours: DayHours[]
  rules: typeof defaultRules
  prediction: typeof defaultPrediction
}

interface NotificationSettingsPayload {
  settings: {
    confirmOnApproval: boolean
    reminderEnabled: boolean
    reminderHoursBefore: number
    cancellationEnabled: boolean
    allowManualResend: boolean
  }
}

interface DataSummaryPayload {
  summary: { label: string; value: number; detail: string }[]
}

const NOTIFICATION_ROWS: {
  key: keyof NotificationSettingsPayload['settings']
  title: string
  detail: string
}[] = [
  { key: 'confirmOnApproval', title: 'Send confirmation after admin approval', detail: 'Automatically send confirmation once a reservation is approved.' },
  { key: 'reminderEnabled', title: 'Send reminder before the reservation', detail: 'Send an automatic reminder ahead of the booking time.' },
  { key: 'cancellationEnabled', title: 'Send cancellation message automatically', detail: 'Notify customers automatically when a reservation is cancelled.' },
  { key: 'allowManualResend', title: 'Allow manual resend', detail: 'Let admins resend failed or pending notifications by hand.' },
]
import { roleLabels, rolePermissions, type Role, type SystemUser, type UserStatus } from '@/data/users'
import { useUsers } from '@/store/UsersContext'
import { SystemControlPanel } from './settings/SystemControlPanel'

const tabs = [
  { id: 'profile', label: 'Restaurant Profile', icon: <Building2 className="size-[15px]" /> },
  { id: 'hours', label: 'Operating Hours', icon: <CalendarClock className="size-[15px]" /> },
  { id: 'rules', label: 'Reservation Rules', icon: <ShieldCheck className="size-[15px]" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="size-[15px]" /> },
  { id: 'prediction', label: 'Prediction & Dashboard', icon: <Brain className="size-[15px]" /> },
  { id: 'users', label: 'Users & Roles', icon: <Users className="size-[15px]" /> },
  { id: 'system', label: 'System Control', icon: <SlidersHorizontal className="size-[15px]" /> },
  { id: 'data', label: 'Data Management', icon: <Database className="size-[15px]" /> },
]

const userStatusTone: Record<UserStatus, BadgeTone> = {
  Active: 'confirmed',
  Invited: 'pending',
  Suspended: 'cancelled',
}

/** BO-12 / LI-7 — the plug-and-play configuration surface. */
export function SettingsPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { allows, user } = useAuth()

  const canManage = allows('manage:settings')
  const canManageUsers = allows('manage:users')

  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  // Settings load from the server; the declared defaults are only the shape
  // used before the first response arrives.
  const settingsQuery = useApi<SettingsPayload>('/settings')
  const notifyQuery = useApi<NotificationSettingsPayload>('/notifications/settings')
  const summaryQuery = useApi<DataSummaryPayload>('/settings/data-summary')

  const [profile, setProfile] = useState(defaultProfile)
  const [hours, setHours] = useState<DayHours[]>(defaultHours)
  const [rules, setRules] = useState(defaultRules)
  const [prediction, setPrediction] = useState(defaultPrediction)

  useEffect(() => {
    const loaded = settingsQuery.data
    if (!loaded) return
    setProfile(loaded.profile)
    setHours(loaded.hours)
    setRules(loaded.rules)
    setPrediction(loaded.prediction)
  }, [settingsQuery.data])

  const liveNotify = notifyQuery.data?.settings
  const notifications = NOTIFICATION_ROWS.map((row) => ({
    id: row.key,
    title: row.title,
    detail: row.detail,
    enabled: liveNotify ? Boolean(liveNotify[row.key]) : false,
  }))

  const setNotifications = async (key: string, value: boolean) => {
    try {
      await api.put('/notifications/settings', { [key]: value })
      notifyQuery.refresh()
    } catch (err) {
      push({ tone: 'error', title: 'Setting not saved', detail: messageOf(err) })
    }
  }

  /** Module 7 — counted from the live database, not a fixed table. */
  const dataSummary = (summaryQuery.data?.summary ?? []).map((d) => ({
    label: d.label,
    value: d.value.toLocaleString('en-PK'),
    detail: d.detail,
  }))
  const { users, invite: inviteUser, setRole, setStatus: setUserStatus, remove: removeUser } = useUsers()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState({ name: '', email: '', role: 'staff' as Role })
  const [inviteErrors, setInviteErrors] = useState<{ name?: string; email?: string }>({})
  const [removingUser, setRemovingUser] = useState<SystemUser | null>(null)

  /** Each tab persists to its own endpoint so a partial save cannot clobber. */
  const save = async (label: string) => {
    setSaving(true)
    try {
      if (label.startsWith('Restaurant')) await api.put('/settings/profile', profile)
      else if (label.startsWith('Operating')) await api.put('/settings/hours', { hours })
      else if (label.startsWith('Reservation')) await api.put('/settings/rules', rules)
      else if (label.startsWith('Prediction')) await api.put('/settings/prediction', prediction)

      settingsQuery.refresh()
      push({ tone: 'success', title: `${label} saved`, detail: 'Your changes are live.' })
    } catch (err) {
      push({ tone: 'error', title: `${label} not saved`, detail: messageOf(err) })
    } finally {
      setSaving(false)
    }
  }

  const sendInvite = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof inviteErrors = {}
    if (!invite.name.trim()) next.name = 'Name is required.'
    if (!invite.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email.trim()))
      next.email = 'Enter a valid email address.'
    else if (users.some((u) => u.email.toLowerCase() === invite.email.trim().toLowerCase()))
      next.email = 'A user with this email already exists.'
    setInviteErrors(next)
    if (Object.keys(next).length) return

    void (async () => {
      try {
        await inviteUser({
          name: invite.name.trim(),
          email: invite.email.trim(),
          role: invite.role,
        })
        push({
          tone: 'success',
          title: 'Invitation sent',
          detail: `${invite.email.trim()} can set a password from the reset screen.`,
        })
        setInvite({ name: '', email: '', role: 'staff' })
        setInviteOpen(false)
      } catch (err) {
        setInviteErrors({ email: messageOf(err) })
      }
    })()
  }

  const userColumns: Column<SystemUser>[] = [
    { key: 'name', header: 'Name', className: 'font-semibold text-ink', render: (u) => u.name },
    { key: 'email', header: 'Email', render: (u) => u.email },
    {
      key: 'role',
      header: 'Role',
      align: 'center',
      render: (u) =>
        canManageUsers && u.id !== user?.id ? (
          <Select
            aria-label={`Role for ${u.name}`}
            value={u.role}
            className="h-[30px] w-[128px] text-xs"
            onChange={(e) => {
              const role = e.target.value as Role
              setRole(u.id, role)
              push({ tone: 'success', title: 'Role updated', detail: `${u.name} is now ${roleLabels[role]}` })
            }}
            options={(Object.keys(roleLabels) as Role[]).map((r) => ({ value: r, label: roleLabels[r] }))}
          />
        ) : (
          <Badge tone="neutral">{roleLabels[u.role]}</Badge>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (u) => <Badge tone={userStatusTone[u.status]}>{u.status}</Badge>,
    },
    { key: 'active', header: 'Last Active', render: (u) => u.lastActive },
    ...(canManageUsers
      ? [
          {
            key: 'action',
            header: 'Action',
            align: 'center' as const,
            className: 'w-[190px]',
            render: (u: SystemUser) => (
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  size="xs"
                  variant={u.status === 'Suspended' ? 'outlineSuccess' : 'outlineNeutral'}
                  disabled={u.id === user?.id}
                  onClick={() => {
                    const status: UserStatus = u.status === 'Suspended' ? 'Active' : 'Suspended'
                    setUserStatus(u.id, status)
                    push({
                      tone: status === 'Active' ? 'success' : 'warning',
                      title: `${u.name} ${status === 'Active' ? 'unblocked' : 'blocked'}`,
                      detail:
                        status === 'Suspended' ? 'They can no longer sign in.' : 'Sign-in restored.',
                    })
                  }}
                >
                  {u.status === 'Suspended' ? 'Unblock' : 'Block'}
                </Button>
                <Button
                  size="xs"
                  variant="outlineDanger"
                  disabled={u.id === user?.id}
                  leftIcon={<Trash2 className="size-[11px]" />}
                  onClick={() => setRemovingUser(u)}
                >
                  Remove
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader title="Settings" underline onToggleNav={toggle} />

      <div className="px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {!canManage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-gold-300 bg-[#FDF7E9] px-4 py-3">
            <ShieldCheck className="mt-px size-[17px] shrink-0 text-gold-600" />
            <p className="text-[12.5px] text-ink-soft">
              You have read-only access to settings. Ask an administrator to make changes.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">
          <Card className="h-fit p-2.5">
            <SideTabs items={tabs} value={tab} onChange={setTab} />
          </Card>

          <div className="min-w-0">
            {/* ------------------------------------------------- profile */}
            {tab === 'profile' && (
              <Panel
                title="Restaurant Profile"
                description="These details brand the booking page, emails and reports. Changing them is all a new restaurant needs to adopt the system."
                onSave={canManage ? () => save('Restaurant profile') : undefined}
                saving={saving}
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="st-name" required>
                      Restaurant name
                    </Label>
                    <Input
                      id="st-name"
                      value={profile.name}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="st-tagline">Tagline</Label>
                    <Input
                      id="st-tagline"
                      value={profile.tagline}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="st-cuisine">Cuisine</Label>
                    <Select
                      id="st-cuisine"
                      value={profile.cuisine}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, cuisine: e.target.value }))}
                      options={cuisines.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="st-phone" required>
                      Contact phone
                    </Label>
                    <Input
                      id="st-phone"
                      icon={<Phone />}
                      value={profile.phone}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="st-email" required>
                      Reservations email
                    </Label>
                    <Input
                      id="st-email"
                      icon={<Mail />}
                      value={profile.email}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="st-address">Address</Label>
                    <Textarea
                      id="st-address"
                      rows={2}
                      value={profile.address}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="st-currency">Currency</Label>
                    <Select
                      id="st-currency"
                      value={profile.currency}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}
                      options={currencies.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="st-tz">Timezone</Label>
                    <Select
                      id="st-tz"
                      value={profile.timezone}
                      disabled={!canManage}
                      onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
                      options={timezones.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                </div>
              </Panel>
            )}

            {/* ------------------------------------------------- hours */}
            {tab === 'hours' && (
              <Panel
                title="Operating Hours"
                description="Time slots can only be created inside these hours."
                onSave={canManage ? () => save('Operating hours') : undefined}
                saving={saving}
              >
                <ul className="grid gap-2">
                  {hours.map((h, i) => (
                    <li
                      key={h.day}
                      className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line px-3.5 py-3"
                    >
                      <span className="w-[92px] shrink-0 text-[12.5px] font-semibold text-ink">
                        {h.day}
                      </span>
                      <Toggle
                        label={`${h.day} open`}
                        checked={!h.closed}
                        onChange={(open) =>
                          canManage &&
                          setHours((prev) =>
                            prev.map((x, xi) => (xi === i ? { ...x, closed: !open } : x)),
                          )
                        }
                      />
                      <span className="w-[54px] text-[11.5px] text-ink-muted">
                        {h.closed ? 'Closed' : 'Open'}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <Select
                          aria-label={`${h.day} opening time`}
                          value={h.open}
                          disabled={h.closed || !canManage}
                          className="h-[34px] w-[112px] text-xs"
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((x, xi) => (xi === i ? { ...x, open: e.target.value } : x)),
                            )
                          }
                          options={timeOptions.map((t) => ({ value: t, label: t }))}
                        />
                        <span className="text-[12px] text-ink-faint">to</span>
                        <Select
                          aria-label={`${h.day} closing time`}
                          value={h.close}
                          disabled={h.closed || !canManage}
                          className="h-[34px] w-[112px] text-xs"
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((x, xi) => (xi === i ? { ...x, close: e.target.value } : x)),
                            )
                          }
                          options={timeOptions.map((t) => ({ value: t, label: t }))}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* ------------------------------------------------- rules */}
            {tab === 'rules' && (
              <Panel
                title="Reservation Rules"
                description="Booking constraints applied to the public reservation form and the admin console."
                onSave={canManage ? () => save('Reservation rules') : undefined}
                saving={saving}
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <NumberField
                    id="rl-hold"
                    label="Auto-cancel unapproved requests after (minutes, 0 = never)"
                    value={rules.holdMinutes}
                    disabled={!canManage}
                    onChange={(v) => setRules((r) => ({ ...r, holdMinutes: v }))}
                  />
                  <NumberField
                    id="rl-slot"
                    label="Slot length (minutes)"
                    value={rules.slotLengthMinutes}
                    disabled={!canManage}
                    onChange={(v) => setRules((r) => ({ ...r, slotLengthMinutes: v }))}
                  />
                  <NumberField
                    id="rl-min"
                    label="Minimum party size"
                    value={rules.minPartySize}
                    disabled={!canManage}
                    onChange={(v) => setRules((r) => ({ ...r, minPartySize: v }))}
                  />
                  <NumberField
                    id="rl-max"
                    label="Maximum party size"
                    value={rules.maxPartySize}
                    disabled={!canManage}
                    onChange={(v) => setRules((r) => ({ ...r, maxPartySize: v }))}
                  />
                  <NumberField
                    id="rl-adv"
                    label="Advance booking window (days)"
                    value={rules.advanceDays}
                    disabled={!canManage}
                    onChange={(v) => setRules((r) => ({ ...r, advanceDays: v }))}
                  />
                </div>

                <ul className="mt-4 divide-y divide-line-soft border-t border-line pt-1">
                  {[
                    { key: 'preventDoubleBooking' as const, title: 'Prevent double booking', detail: 'Block a table that is already held for the same date and time slot.' },
                    { key: 'requireApproval' as const, title: 'Require admin approval', detail: 'New requests stay pending until an administrator confirms them.' },
                    { key: 'allowSameDay' as const, title: 'Allow same-day bookings', detail: 'Customers can book a table for today.' },
                    { key: 'autoReleaseNoShow' as const, title: 'Auto-release no-shows', detail: 'Release the table 20 minutes after the slot starts if guests have not arrived.' },
                  ].map((row) => (
                    <li key={row.key} className="flex items-start gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-ink">{row.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-muted">{row.detail}</p>
                      </div>
                      <Toggle
                        label={row.title}
                        checked={rules[row.key]}
                        onChange={(v) => canManage && setRules((r) => ({ ...r, [row.key]: v }))}
                      />
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* ------------------------------------------------- notifications */}
            {tab === 'notifications' && (
              <Panel
                title="Notification Settings"
                description="Module 8 — confirmation, reminder and cancellation messaging."
                onSave={canManage ? () => save('Notification settings') : undefined}
                saving={saving}
              >
                <ul className="divide-y divide-line-soft">
                  {notifications.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-ink">{s.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-muted">{s.detail}</p>
                      </div>
                      <Toggle
                        label={s.title}
                        checked={s.enabled}
                        onChange={(v) => {
                          if (canManage) void setNotifications(s.id, v)
                        }}
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-[10px] border border-line bg-[#FBF9F7] px-4 py-3.5">
                  <p className="text-[12px] font-bold text-ink">Delivery channels</p>
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    Email is delivered over SMTP; SMS and WhatsApp require the messaging API
                    credentials to be configured on the server.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Badge tone="confirmed">Email · connected</Badge>
                    <Badge tone="pending">SMS · needs API key</Badge>
                    <Badge tone="pending">WhatsApp · needs API key</Badge>
                  </div>
                </div>
              </Panel>
            )}

            {/* ------------------------------------------------- prediction */}
            {tab === 'prediction' && (
              <Panel
                title="Prediction & Dashboard"
                description="Model choices and thresholds that drive the prediction dashboard."
                onSave={canManage ? () => save('Prediction settings') : undefined}
                saving={saving}
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="pr-foot">Footfall model</Label>
                    <Select
                      id="pr-foot"
                      value={prediction.footfallModel}
                      disabled={!canManage}
                      onChange={(e) => setPrediction((p) => ({ ...p, footfallModel: e.target.value }))}
                      options={models.map((m) => ({ value: m, label: m }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pr-rev">Revenue model</Label>
                    <Select
                      id="pr-rev"
                      value={prediction.revenueModel}
                      disabled={!canManage}
                      onChange={(e) => setPrediction((p) => ({ ...p, revenueModel: e.target.value }))}
                      options={models.map((m) => ({ value: m, label: m }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pr-window">Training window</Label>
                    <Select
                      id="pr-window"
                      value={prediction.trainingWindow}
                      disabled={!canManage}
                      onChange={(e) => setPrediction((p) => ({ ...p, trainingWindow: e.target.value }))}
                      options={trainingWindows.map((m) => ({ value: m, label: m }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pr-refresh">Dashboard refresh</Label>
                    <Select
                      id="pr-refresh"
                      value={prediction.refreshInterval}
                      disabled={!canManage}
                      onChange={(e) => setPrediction((p) => ({ ...p, refreshInterval: e.target.value }))}
                      options={refreshIntervals.map((m) => ({ value: m, label: m }))}
                    />
                  </div>
                  <NumberField
                    id="pr-conf"
                    label="Minimum confidence to publish (%)"
                    value={prediction.confidenceThreshold}
                    disabled={!canManage}
                    onChange={(v) => setPrediction((p) => ({ ...p, confidenceThreshold: v }))}
                  />
                  <NumberField
                    id="pr-waste"
                    label="Wastage target (%)"
                    value={prediction.wastageTargetPct}
                    disabled={!canManage}
                    onChange={(v) => setPrediction((p) => ({ ...p, wastageTargetPct: v }))}
                  />
                  <NumberField
                    id="pr-buffer"
                    label="Food shortage buffer (%)"
                    value={prediction.shortageBufferPct}
                    disabled={!canManage}
                    onChange={(v) => setPrediction((p) => ({ ...p, shortageBufferPct: v }))}
                  />
                  <NumberField
                    id="pr-server"
                    label="Guests per serving staff"
                    value={prediction.guestsPerServer}
                    disabled={!canManage}
                    onChange={(v) => setPrediction((p) => ({ ...p, guestsPerServer: v }))}
                  />
                  <NumberField
                    id="pr-chef"
                    label="Guests per chef"
                    value={prediction.guestsPerChef}
                    disabled={!canManage}
                    onChange={(v) => setPrediction((p) => ({ ...p, guestsPerChef: v }))}
                  />
                </div>
              </Panel>
            )}

            {/* ------------------------------------------------- users */}
            {tab === 'users' && (
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-4">
                  <div>
                    <h2 className="text-[15px] font-bold text-ink">Users &amp; Roles</h2>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      Module 8 — admin, manager and staff each get a different slice of the console.
                    </p>
                  </div>
                  {canManageUsers && (
                    <Button
                      size="sm"
                      leftIcon={<Plus className="size-[14px]" />}
                      onClick={() => setInviteOpen(true)}
                    >
                      Invite user
                    </Button>
                  )}
                </div>

                <DataTable columns={userColumns} rows={users} rowKey={(u) => u.id} minWidth={900} />

                <div className="border-t border-line p-4">
                  <SectionTitle icon={<ShieldCheck className="size-[15px]" strokeWidth={2.3} />}>
                    Role permissions
                  </SectionTitle>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(Object.keys(roleLabels) as Role[]).map((r) => {
                      const perms = rolePermissions[r]
                      return (
                        <div key={r} className="rounded-[10px] border border-line bg-[#FBF9F7] p-3.5">
                          <p className="text-[12.5px] font-bold text-ink">{roleLabels[r]}</p>
                          <p className="mt-1 text-[11px] text-ink-muted">
                            {perms === 'all' ? 'Full access to every module.' : `${perms.length} permissions granted.`}
                          </p>
                          <ul className="mt-2.5 grid gap-1">
                            {(perms === 'all'
                              ? ['Everything, including user management']
                              : [
                                  perms.includes('manage:reservations') ? 'Manage reservations' : 'View reservations',
                                  perms.includes('manage:tables') ? 'Manage tables & slots' : 'View tables & slots',
                                  perms.includes('manage:staff') ? 'Manage staff records' : 'View staff records',
                                  perms.includes('view:reports') ? 'View reports & predictions' : 'No reporting access',
                                  perms.includes('view:settings') ? 'Read settings' : 'No settings access',
                                ]
                            ).map((line) => (
                              <li key={line} className="flex items-start gap-1.5 text-[11px] text-ink-soft">
                                <Check className="mt-px size-[12px] shrink-0 text-state-success" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* ----------------------------------------------- system */}
            {tab === 'system' && <SystemControlPanel canManage={canManageUsers} />}

            {/* ------------------------------------------------- data */}
            {tab === 'data' && (
              <Panel
                title="Data Management"
                description="Module 7 — the centralised store behind reservations, predictions and reports."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {dataSummary.map((d) => (
                    <div key={d.label} className="rounded-[10px] border border-line bg-[#FBF9F7] px-3.5 py-3">
                      <p className="text-[11.5px] text-ink-muted">{d.label}</p>
                      <p className="mt-1 text-[19px] font-extrabold leading-none text-ink">{d.value}</p>
                      <p className="mt-1.5 text-[10.5px] text-ink-faint">{d.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="size-[13px]" />}
                    onClick={() => push({ tone: 'info', title: 'Export started', detail: 'A CSV archive is being prepared.' })}
                  >
                    Export all data
                  </Button>
                  <Button
                    variant="outlineNeutral"
                    size="sm"
                    leftIcon={<Database className="size-[13px]" />}
                    onClick={() => push({ tone: 'success', title: 'Backup scheduled', detail: 'Runs tonight at 02:00 AM.' })}
                  >
                    Run backup now
                  </Button>
                </div>

                <p className="mt-3 text-[11.5px] text-ink-muted">
                  Historical reservation, sales, food-usage and staffing records are retained to
                  train the prediction models.
                </p>
              </Panel>
            )}
          </div>
        </div>
      </div>

      {/* Invite user */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a user"
        subtitle="They will receive an email to set a password and join the console."
        width="max-w-[460px]"
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="invite-form">
              Send invitation
            </Button>
          </>
        }
      >
        <form id="invite-form" noValidate onSubmit={sendInvite} className="grid gap-3.5">
          <div>
            <Label htmlFor="iv-name" required>
              Full name
            </Label>
            <Input
              id="iv-name"
              value={invite.name}
              error={inviteErrors.name}
              onChange={(e) => {
                setInvite((i) => ({ ...i, name: e.target.value }))
                setInviteErrors((x) => ({ ...x, name: undefined }))
              }}
              placeholder="e.g. Sana Riaz"
            />
            <FieldError>{inviteErrors.name}</FieldError>
          </div>
          <div>
            <Label htmlFor="iv-email" required>
              Email address
            </Label>
            <Input
              id="iv-email"
              icon={<Mail />}
              value={invite.email}
              error={inviteErrors.email}
              onChange={(e) => {
                setInvite((i) => ({ ...i, email: e.target.value }))
                setInviteErrors((x) => ({ ...x, email: undefined }))
              }}
              placeholder="name@asianwok.pk"
            />
            <FieldError>{inviteErrors.email}</FieldError>
          </div>
          <div>
            <Label htmlFor="iv-role" required>
              Role
            </Label>
            <Select
              id="iv-role"
              value={invite.role}
              onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value as Role }))}
              options={(Object.keys(roleLabels) as Role[]).map((r) => ({ value: r, label: roleLabels[r] }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={removingUser !== null}
        title="Remove this user?"
        message={`${removingUser?.name ?? ''} will immediately lose access to the console.`}
        confirmLabel="Remove user"
        onCancel={() => setRemovingUser(null)}
        onConfirm={() => {
          if (removingUser) {
            removeUser(removingUser.id)
            push({ tone: 'info', title: 'User removed', detail: removingUser.name })
          }
          setRemovingUser(null)
        }}
      />
    </>
  )
}

function Panel({
  title,
  description,
  children,
  onSave,
  saving,
}: {
  title: string
  description: string
  children: ReactNode
  onSave?: () => void
  saving?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          <p className="mt-1 max-w-[560px] text-[12px] text-ink-muted">{description}</p>
        </div>
        {onSave && (
          <Button
            size="sm"
            disabled={saving}
            leftIcon={
              saving ? <Loader2 className="size-[13px] animate-spin" /> : <Save className="size-[13px]" />
            }
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </div>
      <div className={cn('pt-4')}>{children}</div>
    </Card>
  )
}

function NumberField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

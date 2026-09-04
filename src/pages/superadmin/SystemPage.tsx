import { useState } from 'react'
import {
  AlertTriangle,
  Database,
  Download,
  Flag,
  Loader2,
  PowerOff,
  RotateCcw,
  Save,
  ServerCog,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Textarea, Toggle } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { useSystem, type SystemSettings } from '@/store/SystemContext'
import { usePlatform } from '@/store/PlatformContext'
import { useUsers } from '@/store/UsersContext'
import { dataSummary } from '@/data/settings'

const availability: {
  key: keyof SystemSettings
  title: string
  detail: string
  endpoint: string
  danger?: boolean
}[] = [
  {
    key: 'maintenanceMode',
    title: 'Maintenance mode',
    detail: 'Replaces the landing, booking and tracking pages with a maintenance notice.',
    endpoint: 'POST /admin/system/maintenance',
    danger: true,
  },
  {
    key: 'adminOnlyLogin',
    title: 'Administrator-only sign-in',
    detail: 'Managers and staff are refused at the login screen.',
    endpoint: 'POST /admin/system/lockdown',
    danger: true,
  },
  {
    key: 'readOnlyMode',
    title: 'Read-only mode',
    detail: 'Non-admin roles can view every module but cannot write.',
    endpoint: 'POST /admin/system/read-only',
  },
  {
    key: 'publicBookingEnabled',
    title: 'Public booking form',
    detail: 'Guests can submit reservation requests at /reserve.',
    endpoint: 'PATCH /admin/system/public-booking',
  },
  {
    key: 'trackingEnabled',
    title: 'Guest booking tracker',
    detail: 'Guests can look up a reservation at /track.',
    endpoint: 'PATCH /admin/system/tracking',
  },
  {
    key: 'registrationEnabled',
    title: 'New account registration',
    detail: 'Accounts are invitation-only in this build; leave off unless self-signup ships.',
    endpoint: 'PATCH /admin/system/registration',
  },
  {
    key: 'restaurantSubmissionsEnabled',
    title: 'Restaurant submissions',
    detail: 'Allows restaurants to submit themselves to the showcase for approval.',
    endpoint: 'PATCH /admin/system/restaurant-submissions',
  },
]

/** Platform availability, feature flags and data operations. */
export function SystemPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { system, update, reset } = useSystem()
  const { flags, setFlag, log } = usePlatform()
  const { users, setStatus } = useUsers()

  const [tab, setTab] = useState<'availability' | 'features' | 'data'>('availability')
  const [saving, setSaving] = useState(false)
  const [confirmKey, setConfirmKey] = useState<(typeof availability)[number] | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [lockoutOpen, setLockoutOpen] = useState(false)
  const [purgeOpen, setPurgeOpen] = useState(false)

  const activeNonAdmins = users.filter(
    (u) => u.role !== 'admin' && u.role !== 'superadmin' && u.status === 'Active',
  )

  const applyToggle = (row: (typeof availability)[number], next: boolean) => {
    if (next && row.danger) {
      setConfirmKey(row)
      return
    }
    update({ [row.key]: next } as Partial<SystemSettings>)
    log({
      action: `${next ? 'Enabled' : 'Disabled'} ${row.title.toLowerCase()}`,
      target: 'System',
      category: 'System',
    })
    push({ tone: next ? 'warning' : 'success', title: `${row.title} ${next ? 'enabled' : 'disabled'}` })
  }

  const savePolicy = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    log({ action: 'Updated security policy', target: 'System', category: 'System' })
    push({ tone: 'success', title: 'Policy saved' })
  }

  const restrictions = availability.filter(
    (a) => a.danger && Boolean(system[a.key]),
  )

  return (
    <>
      <PageHeader
        title="System Controls"
        underline
        onToggleNav={toggle}
        profileName="Super Admin"
        profileRole="Platform"
        action={
          <Button
            variant="outlineNeutral"
            leftIcon={<RotateCcw className="size-[15px]" />}
            onClick={() => setResetOpen(true)}
          >
            Reset defaults
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {restrictions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-state-danger/25 bg-state-dangerBg px-4 py-3">
            <AlertTriangle className="size-[17px] shrink-0 text-state-danger" />
            <p className="text-[12.5px] font-bold text-ink">Restrictions active:</p>
            {restrictions.map((r) => (
              <Badge key={String(r.key)} tone="cancelled">
                {r.title}
              </Badge>
            ))}
          </div>
        )}

        <Card className="overflow-hidden">
          <Tabs
            className="px-2 pt-1"
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            items={[
              { id: 'availability', label: 'Platform availability' },
              { id: 'features', label: 'Feature flags', count: flags.filter((f) => !f.enabled).length },
              { id: 'data', label: 'Data & maintenance' },
            ]}
          />

          {/* ------------------------------------------- availability */}
          {tab === 'availability' && (
            <div className="p-4">
              <SectionTitle icon={<PowerOff className="size-[16px]" strokeWidth={2.3} />}>
                Availability &amp; Access
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Each switch changes the running app immediately and names the endpoint a server
                would persist it to.
              </p>

              <ul className="mt-3.5 divide-y divide-line-soft">
                {availability.map((row) => {
                  const value = Boolean(system[row.key])
                  return (
                    <li key={String(row.key)} className="flex items-start gap-3 py-3.5">
                      <span
                        className={cn(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[9px]',
                          row.danger
                            ? 'bg-state-dangerBg text-state-danger'
                            : 'bg-brand-50 text-brand-700',
                        )}
                      >
                        <ServerCog className="size-[17px]" strokeWidth={1.9} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink">
                          {row.title}
                          {value && row.danger && <Badge tone="cancelled">Active</Badge>}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">{row.detail}</p>
                        <code className="mt-1.5 inline-block rounded bg-line-soft px-1.5 py-0.5 text-[10px] text-ink-muted">
                          {row.endpoint}
                        </code>
                      </div>
                      <Toggle
                        label={row.title}
                        checked={value}
                        onChange={(next) => applyToggle(row, next)}
                      />
                    </li>
                  )
                })}
              </ul>

              <div className="mt-3 grid gap-3.5 border-t border-line pt-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="sys-msg">Maintenance notice</Label>
                  <Textarea
                    id="sys-msg"
                    rows={2}
                    value={system.maintenanceMessage}
                    onChange={(e) => update({ maintenanceMessage: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sys-eta">Estimated return</Label>
                  <Input
                    id="sys-eta"
                    value={system.maintenanceEta}
                    placeholder="e.g. Today at 6:00 PM"
                    onChange={(e) => update({ maintenanceEta: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sys-timeout">Idle session timeout (minutes)</Label>
                  <Input
                    id="sys-timeout"
                    type="number"
                    min={5}
                    max={480}
                    value={system.sessionTimeoutMinutes}
                    onChange={(e) => update({ sessionTimeoutMinutes: Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={saving}
                    leftIcon={saving ? <Loader2 className="size-[13px] animate-spin" /> : <Save className="size-[13px]" />}
                    onClick={savePolicy}
                  >
                    Save settings
                  </Button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="mt-4 rounded-[10px] border border-state-danger/25 p-4">
                <h3 className="flex items-center gap-2 text-[13.5px] font-bold text-state-danger">
                  <AlertTriangle className="size-[16px]" />
                  Danger zone
                </h3>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[9px] border border-line px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-ink">Block all non-admin accounts</p>
                    <p className="mt-1 text-[11.5px] text-ink-muted">
                      Suspends {activeNonAdmins.length} active manager and staff account
                      {activeNonAdmins.length === 1 ? '' : 's'} at once.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={activeNonAdmins.length === 0}
                    onClick={() => setLockoutOpen(true)}
                  >
                    Block all
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------ features */}
          {tab === 'features' && (
            <div className="p-4">
              <SectionTitle icon={<Flag className="size-[16px]" strokeWidth={2.3} />}>
                Feature Flags
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Turn a module off across the platform. Only features that exist in this build are
                listed.
              </p>

              <div className="mt-3.5 grid gap-4">
                {(['Public', 'Console', 'Analytics', 'Messaging'] as const).map((area) => {
                  const rows = flags.filter((f) => f.area === area)
                  if (rows.length === 0) return null
                  return (
                    <div key={area}>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-brand-700">
                        {area}
                      </p>
                      <ul className="grid gap-2">
                        {rows.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-start gap-3 rounded-[9px] border border-line px-3.5 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-ink">
                                {f.name}
                                <Badge tone={f.enabled ? 'confirmed' : 'neutral'}>
                                  {f.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </p>
                              <p className="mt-1 text-[11.5px] text-ink-muted">{f.description}</p>
                              <code className="mt-1.5 inline-block rounded bg-line-soft px-1.5 py-0.5 text-[10px] text-ink-muted">
                                {f.endpoint}
                              </code>
                            </div>
                            <Toggle
                              label={f.name}
                              checked={f.enabled}
                              onChange={(v) => {
                                setFlag(f.id, v)
                                push({
                                  tone: v ? 'success' : 'warning',
                                  title: `${f.name} ${v ? 'enabled' : 'disabled'}`,
                                })
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- data */}
          {tab === 'data' && (
            <div className="p-4">
              <SectionTitle icon={<Database className="size-[16px]" strokeWidth={2.3} />}>
                Data &amp; Maintenance
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Record counts come from the local mock data layer in this build.
              </p>

              <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  onClick={() => {
                    log({ action: 'Requested data export', target: 'All records', category: 'System' })
                    push({ tone: 'info', title: 'Export queued', detail: 'A CSV archive is being prepared.' })
                  }}
                >
                  Export all data
                </Button>
                <Button
                  variant="outlineNeutral"
                  size="sm"
                  leftIcon={<Database className="size-[13px]" />}
                  onClick={() => {
                    log({ action: 'Triggered backup', target: 'Database', category: 'System' })
                    push({ tone: 'success', title: 'Backup scheduled', detail: 'Runs tonight at 02:00 AM.' })
                  }}
                >
                  Run backup now
                </Button>
                <Button
                  variant="outlineDanger"
                  size="sm"
                  leftIcon={<Trash2 className="size-[13px]" />}
                  onClick={() => setPurgeOpen(true)}
                >
                  Clear demo data
                </Button>
              </div>

              <p className="mt-3 rounded-[9px] bg-[#FDF3DC] px-3 py-2.5 text-[11.5px] text-ink-soft">
                <strong className="text-ink">Backend note:</strong> export, backup and purge need
                server endpoints (<code className="rounded bg-white px-1">POST /admin/data/export</code>,{' '}
                <code className="rounded bg-white px-1">POST /admin/data/backup</code>). Nothing here
                touches a real database yet.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------------ dialogs */}
      <ConfirmDialog
        open={confirmKey !== null}
        title={`Enable ${confirmKey?.title.toLowerCase() ?? ''}?`}
        message={confirmKey?.detail ?? ''}
        confirmLabel="Enable"
        onCancel={() => setConfirmKey(null)}
        onConfirm={() => {
          if (confirmKey) {
            update({ [confirmKey.key]: true } as Partial<SystemSettings>)
            log({
              action: `Enabled ${confirmKey.title.toLowerCase()}`,
              target: 'System',
              category: 'System',
            })
            push({ tone: 'warning', title: `${confirmKey.title} enabled` })
          }
          setConfirmKey(null)
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Reset system settings?"
        message="Availability switches, the maintenance notice and the security policy all return to their defaults. Feature flags are not affected."
        confirmLabel="Reset settings"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          reset()
          log({ action: 'Reset system settings', target: 'System', category: 'System' })
          push({ tone: 'success', title: 'System settings reset' })
          setResetOpen(false)
        }}
      />

      <ConfirmDialog
        open={lockoutOpen}
        title="Block all non-admin accounts?"
        message={`${activeNonAdmins.length} account${activeNonAdmins.length === 1 ? '' : 's'} will be suspended immediately and refused at sign-in.`}
        confirmLabel="Block all accounts"
        onCancel={() => setLockoutOpen(false)}
        onConfirm={() => {
          activeNonAdmins.forEach((u) => setStatus(u.id, 'Suspended'))
          log({
            action: 'Blocked all non-admin accounts',
            target: `${activeNonAdmins.length} accounts`,
            category: 'Security',
          })
          push({ tone: 'warning', title: 'Accounts blocked', detail: `${activeNonAdmins.length} suspended.` })
          setLockoutOpen(false)
        }}
      />

      <ConfirmDialog
        open={purgeOpen}
        title="Clear demo data?"
        message="This would remove seeded reservations, restaurants and staff on a real deployment. In this build the data layer is in memory, so a page reload restores it."
        confirmLabel="Continue"
        onCancel={() => setPurgeOpen(false)}
        onConfirm={() => {
          log({ action: 'Requested demo data purge', target: 'Mock data layer', category: 'System' })
          push({ tone: 'info', title: 'Purge requires a backend', detail: 'No records were changed.' })
          setPurgeOpen(false)
        }}
      />
    </>
  )
}

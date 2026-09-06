import { useState } from 'react'
import { AlertTriangle, Loader2, LogOut, Monitor, Save, ShieldAlert, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Toggle } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useSystem } from '@/store/SystemContext'
import { usePlatform } from '@/store/PlatformContext'
import type { AdminSession } from '@/data/platform'

/** Sessions, sign-in policy and suspicious-activity review. */
export function SecurityPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { system, update } = useSystem()
  const { sessions, revokeSession, revokeAllOthers, audit, log } = usePlatform()

  const [tab, setTab] = useState<'sessions' | 'policy' | 'activity'>('sessions')
  const [saving, setSaving] = useState(false)
  const [revoking, setRevoking] = useState<AdminSession | null>(null)
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)

  const failedAttempts = audit.filter((a) => a.result === 'Failed')
  const securityEvents = audit.filter((a) => a.category === 'Security' || a.category === 'User')

  const savePolicy = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    log({ action: 'Updated security policy', target: 'Sign-in policy', category: 'Security' })
    push({ tone: 'success', title: 'Security policy saved' })
  }

  const sessionColumns: Column<AdminSession>[] = [
    {
      key: 'user',
      header: 'User',
      className: 'font-semibold text-ink',
      render: (s) => (
        <span className="flex items-center gap-2">
          {s.user}
          {s.current && <Badge tone="confirmed">This device</Badge>}
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (s) => s.email },
    { key: 'role', header: 'Role', render: (s) => s.role },
    {
      key: 'device',
      header: 'Device',
      render: (s) => (
        <span className="inline-flex items-center gap-1.5">
          <Monitor className="size-[13px] text-ink-faint" />
          {s.device}
        </span>
      ),
    },
    { key: 'location', header: 'Location', render: (s) => s.location },
    { key: 'started', header: 'Signed in', render: (s) => s.startedAt },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[130px]',
      render: (s) => (
        <Button
          size="xs"
          variant="outlineDanger"
          leftIcon={<LogOut className="size-[11px]" />}
          disabled={s.current}
          onClick={() => setRevoking(s)}
        >
          Sign out
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Security"
        underline
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <div className="flex items-start gap-2.5 rounded-[10px] border border-line bg-white px-4 py-3">
          <ShieldCheck className="mt-px size-[17px] shrink-0 text-brand-700" />
          <p className="text-[12.5px] text-ink-soft">
            Credentials, API keys and password hashes are never displayed here. Revoking a session
            and forcing a reset both require server endpoints —{' '}
            <code className="rounded bg-line-soft px-1">DELETE /admin/sessions/:id</code> and{' '}
            <code className="rounded bg-line-soft px-1">POST /admin/users/:id/reset</code>.
          </p>
        </div>

        <Card className="overflow-hidden">
          <Tabs
            className="px-2 pt-1"
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            items={[
              { id: 'sessions', label: 'Active sessions', count: sessions.length },
              { id: 'policy', label: 'Sign-in policy' },
              { id: 'activity', label: 'Security activity', count: securityEvents.length },
            ]}
          />

          {/* ---------------------------------------------- sessions */}
          {tab === 'sessions' && (
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle icon={<Monitor className="size-[16px]" strokeWidth={2.3} />}>
                  Active Sessions
                </SectionTitle>
                <Button
                  size="sm"
                  variant="outlineDanger"
                  disabled={sessions.filter((s) => !s.current).length === 0}
                  leftIcon={<LogOut className="size-[13px]" />}
                  onClick={() => setRevokeAllOpen(true)}
                >
                  Sign out all other devices
                </Button>
              </div>

              <div className="mt-3.5 overflow-hidden rounded-[10px] border border-line">
                {sessions.length === 0 ? (
                  <EmptyState title="No active sessions" detail="Nobody is signed in right now." />
                ) : (
                  <DataTable
                    columns={sessionColumns}
                    rows={sessions}
                    rowKey={(s) => s.id}
                    minWidth={980}
                  />
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------ policy */}
          {tab === 'policy' && (
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <SectionTitle icon={<ShieldAlert className="size-[16px]" strokeWidth={2.3} />}>
                    Sign-in Policy
                  </SectionTitle>
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    Applied to every console account.
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={saving}
                  leftIcon={
                    saving ? <Loader2 className="size-[13px] animate-spin" /> : <Save className="size-[13px]" />
                  }
                  onClick={savePolicy}
                >
                  {saving ? 'Saving…' : 'Save policy'}
                </Button>
              </div>

              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sec-timeout">Idle session timeout (minutes)</Label>
                  <Input
                    id="sec-timeout"
                    type="number"
                    min={5}
                    max={480}
                    value={system.sessionTimeoutMinutes}
                    onChange={(e) => update({ sessionTimeoutMinutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="sec-minpass">Minimum password length</Label>
                  <Input
                    id="sec-minpass"
                    type="number"
                    min={6}
                    max={32}
                    value={system.minPasswordLength}
                    onChange={(e) => update({ minPasswordLength: Number(e.target.value) })}
                  />
                </div>
              </div>

              <ul className="mt-4 divide-y divide-line-soft border-t border-line pt-1">
                {[
                  {
                    key: 'requireStrongPassword' as const,
                    title: 'Require strong passwords',
                    detail: 'Enforce an uppercase letter, a lowercase letter and a number.',
                  },
                  {
                    key: 'adminOnlyLogin' as const,
                    title: 'Administrator-only sign-in',
                    detail: 'Managers and staff are refused at the login screen.',
                  },
                  {
                    key: 'readOnlyMode' as const,
                    title: 'Read-only mode',
                    detail: 'Non-admin roles can view but not write.',
                  },
                ].map((row) => (
                  <li key={row.key} className="flex items-start gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-ink">{row.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-muted">{row.detail}</p>
                    </div>
                    <Toggle
                      label={row.title}
                      checked={Boolean(system[row.key])}
                      onChange={(v) => {
                        update({ [row.key]: v })
                        push({
                          tone: v ? 'warning' : 'success',
                          title: `${row.title} ${v ? 'enabled' : 'disabled'}`,
                        })
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ---------------------------------------------- activity */}
          {tab === 'activity' && (
            <div className="p-4">
              <SectionTitle icon={<AlertTriangle className="size-[16px]" strokeWidth={2.3} />}>
                Security Activity
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Sign-in attempts, account changes and session events.
              </p>

              {failedAttempts.length > 0 && (
                <div className="mt-3 flex items-start gap-2.5 rounded-[9px] border border-state-danger/25 bg-state-dangerBg px-3.5 py-3">
                  <AlertTriangle className="mt-px size-[15px] shrink-0 text-state-danger" />
                  <p className="text-[12px] text-ink-soft">
                    <strong className="text-ink">
                      {failedAttempts.length} failed action
                      {failedAttempts.length === 1 ? '' : 's'}
                    </strong>{' '}
                    recorded. Review the entries below and block the account if the pattern looks
                    suspicious.
                  </p>
                </div>
              )}

              <ul className="mt-3.5 divide-y divide-line-soft">
                {securityEvents.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <Badge tone={a.result === 'Success' ? 'confirmed' : 'cancelled'}>{a.result}</Badge>
                    <span className="text-[12.5px] font-semibold text-ink">{a.action}</span>
                    <span className="text-[12px] text-ink-muted">{a.target}</span>
                    <span className="ml-auto text-[10.5px] text-ink-faint">
                      {a.actor} · {a.at}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={revoking !== null}
        title="Sign this device out?"
        message={`${revoking?.user ?? ''} will be signed out on ${revoking?.device ?? ''} and must authenticate again.`}
        confirmLabel="Sign out device"
        onCancel={() => setRevoking(null)}
        onConfirm={() => {
          if (revoking) {
            revokeSession(revoking.id)
            push({ tone: 'info', title: 'Session revoked', detail: revoking.email })
          }
          setRevoking(null)
        }}
      />

      <ConfirmDialog
        open={revokeAllOpen}
        title="Sign out all other devices?"
        message="Every session except this one is revoked. Anyone affected must sign in again."
        confirmLabel="Sign out all"
        onCancel={() => setRevokeAllOpen(false)}
        onConfirm={() => {
          revokeAllOthers()
          push({ tone: 'warning', title: 'All other sessions revoked' })
          setRevokeAllOpen(false)
        }}
      />
    </>
  )
}

import { useState } from 'react'
import {
  AlertTriangle,
  Eye,
  Loader2,
  Lock,
  PowerOff,
  RotateCcw,
  Save,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Textarea, Toggle } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { useSystem, type SystemSettings } from '@/store/SystemContext'
import { useUsers } from '@/store/UsersContext'

interface SwitchRow {
  key: keyof SystemSettings
  icon: typeof Wrench
  title: string
  detail: string
  danger?: boolean
  /** Copy shown in the confirmation dialog when switching this ON. */
  confirmOn?: { title: string; message: string; label: string }
}

const switches: SwitchRow[] = [
  {
    key: 'maintenanceMode',
    icon: PowerOff,
    title: 'Maintenance mode',
    detail:
      'Takes the public website offline behind a maintenance notice. The admin console stays reachable so you can bring it back up.',
    danger: true,
    confirmOn: {
      title: 'Take the public site offline?',
      message:
        'Guests visiting the website will see a maintenance notice instead of the landing, booking and tracking pages. Staff can still sign in to the console.',
      label: 'Enable maintenance mode',
    },
  },
  {
    key: 'adminOnlyLogin',
    icon: ShieldAlert,
    title: 'Administrator-only sign-in',
    detail:
      'Only administrator accounts may sign in. Managers and staff are refused at the login screen until this is switched off.',
    danger: true,
    confirmOn: {
      title: 'Lock the console to administrators?',
      message:
        'Managers and staff will be refused at sign-in. Anyone already signed in keeps their session until they sign out.',
      label: 'Restrict to admins',
    },
  },
  {
    key: 'readOnlyMode',
    icon: Eye,
    title: 'Read-only mode',
    detail:
      'Managers and staff can view every module but cannot create, edit or delete records. Administrators are unaffected.',
  },
  {
    key: 'publicBookingEnabled',
    icon: Lock,
    title: 'Public booking form',
    detail:
      'When off, the reservation page is closed and guests are sent back to the landing page. Useful for private events or full days.',
  },
  {
    key: 'trackingEnabled',
    icon: Eye,
    title: 'Guest booking tracker',
    detail: 'Lets guests look up a reservation status with their booking reference.',
  },
]

/**
 * Administrator-only system controls: maintenance window, sign-in lockdown,
 * read-only mode, public-surface switches, session and password policy.
 */
export function SystemControlPanel({ canManage }: { canManage: boolean }) {
  const { system, update, reset } = useSystem()
  const { users, setStatus } = useUsers()
  const { push } = useToast()

  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<SwitchRow | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [lockoutOpen, setLockoutOpen] = useState(false)

  const activeNonAdmins = users.filter((u) => u.role !== 'admin' && u.status === 'Active')

  const applySwitch = (row: SwitchRow, next: boolean) => {
    if (!canManage) return
    if (next && row.confirmOn) {
      setConfirm(row)
      return
    }
    update({ [row.key]: next } as Partial<SystemSettings>)
    push({
      tone: next ? 'warning' : 'success',
      title: `${row.title} ${next ? 'enabled' : 'disabled'}`,
    })
  }

  const savePolicy = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    push({ tone: 'success', title: 'Security policy saved' })
  }

  return (
    <div className="grid gap-4">
      {(system.maintenanceMode || system.adminOnlyLogin || system.readOnlyMode) && (
        <div className="flex items-start gap-2.5 rounded-[10px] border border-state-danger/25 bg-state-dangerBg px-4 py-3">
          <AlertTriangle className="mt-px size-[17px] shrink-0 text-state-danger" />
          <div>
            <p className="text-[12.5px] font-bold text-ink">System restrictions are active</p>
            <p className="mt-1 flex flex-wrap gap-1.5 text-[11.5px] text-ink-soft">
              {system.maintenanceMode && <Badge tone="cancelled">Public site offline</Badge>}
              {system.adminOnlyLogin && <Badge tone="cancelled">Admins only</Badge>}
              {system.readOnlyMode && <Badge tone="pending">Read-only</Badge>}
            </p>
          </div>
        </div>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-[15px] font-bold text-ink">System Control</h2>
            <p className="mt-1 max-w-[560px] text-[12px] text-ink-muted">
              Switches that affect the whole deployment. Only administrators can change them.
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              variant="outlineNeutral"
              leftIcon={<RotateCcw className="size-[13px]" />}
              onClick={() => setResetOpen(true)}
            >
              Reset to defaults
            </Button>
          )}
        </div>

        <ul className="divide-y divide-line-soft">
          {switches.map((row) => {
            const Icon = row.icon
            const value = Boolean(system[row.key])
            return (
              <li key={String(row.key)} className="flex items-start gap-3 py-4">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-[9px]',
                    row.danger ? 'bg-state-dangerBg text-state-danger' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink">
                    {row.title}
                    {value && row.danger && <Badge tone="cancelled">Active</Badge>}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">{row.detail}</p>
                </div>
                <Toggle
                  label={row.title}
                  checked={value}
                  onChange={(next) => applySwitch(row, next)}
                />
              </li>
            )
          })}
        </ul>

        <div className="mt-2 border-t border-line pt-4">
          <Label htmlFor="sys-msg">Maintenance notice shown to guests</Label>
          <Textarea
            id="sys-msg"
            rows={2}
            value={system.maintenanceMessage}
            disabled={!canManage}
            onChange={(e) => update({ maintenanceMessage: e.target.value })}
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-[15px] font-bold text-ink">Session &amp; Password Policy</h2>
            <p className="mt-1 text-[12px] text-ink-muted">
              Applied to every console account (Module 8 FE-1).
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              disabled={saving}
              leftIcon={
                saving ? (
                  <Loader2 className="size-[13px] animate-spin" />
                ) : (
                  <Save className="size-[13px]" />
                )
              }
              onClick={savePolicy}
            >
              {saving ? 'Saving…' : 'Save policy'}
            </Button>
          )}
        </div>

        <div className="grid gap-3.5 pt-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sys-timeout">Idle session timeout (minutes)</Label>
            <Input
              id="sys-timeout"
              type="number"
              min={5}
              max={480}
              value={system.sessionTimeoutMinutes}
              disabled={!canManage}
              onChange={(e) => update({ sessionTimeoutMinutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="sys-minpass">Minimum password length</Label>
            <Input
              id="sys-minpass"
              type="number"
              min={6}
              max={32}
              value={system.minPasswordLength}
              disabled={!canManage}
              onChange={(e) => update({ minPasswordLength: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 border-t border-line pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">Require strong passwords</p>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              Enforce an uppercase letter, a lowercase letter and a number on every password reset.
            </p>
          </div>
          <Toggle
            label="Require strong passwords"
            checked={system.requireStrongPassword}
            onChange={(v) => canManage && update({ requireStrongPassword: v })}
          />
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-state-danger/25 p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-state-danger">
          <AlertTriangle className="size-[17px]" />
          Danger zone
        </h2>
        <p className="mt-1 text-[12px] text-ink-muted">
          These actions affect everyone signed in to the console.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-ink">
              Block all non-administrator accounts
            </p>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              Suspends {activeNonAdmins.length} active manager and staff account
              {activeNonAdmins.length === 1 ? '' : 's'} at once. They can be reactivated
              individually from Users &amp; Roles.
            </p>
          </div>
          <Button
            size="sm"
            variant="danger"
            disabled={!canManage || activeNonAdmins.length === 0}
            leftIcon={<Lock className="size-[13px]" />}
            onClick={() => setLockoutOpen(true)}
          >
            Block all
          </Button>
        </div>
      </Card>

      {/* --------------------------------------------------------- dialogs */}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.confirmOn?.title ?? ''}
        message={confirm?.confirmOn?.message ?? ''}
        confirmLabel={confirm?.confirmOn?.label ?? 'Confirm'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            update({ [confirm.key]: true } as Partial<SystemSettings>)
            push({ tone: 'warning', title: `${confirm.title} enabled` })
          }
          setConfirm(null)
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Reset system settings?"
        message="Maintenance mode, sign-in restrictions, public switches and the security policy all return to their defaults."
        confirmLabel="Reset settings"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          reset()
          push({ tone: 'success', title: 'System settings reset' })
          setResetOpen(false)
        }}
      />

      <ConfirmDialog
        open={lockoutOpen}
        title="Block all non-administrator accounts?"
        message={`${activeNonAdmins.length} manager and staff account${activeNonAdmins.length === 1 ? '' : 's'} will be suspended immediately and refused at sign-in.`}
        confirmLabel="Block all accounts"
        onCancel={() => setLockoutOpen(false)}
        onConfirm={() => {
          activeNonAdmins.forEach((u) => setStatus(u.id, 'Suspended'))
          push({
            tone: 'warning',
            title: 'Accounts blocked',
            detail: `${activeNonAdmins.length} account${activeNonAdmins.length === 1 ? '' : 's'} suspended.`,
          })
          setLockoutOpen(false)
        }}
      />
    </div>
  )
}

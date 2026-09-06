import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, KeyRound, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/auth/AuthContext'
import { roleLabels } from '@/data/users'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { api, fieldErrorsOf, messageOf } from '@/lib/api'

/**
 * The signed-in user, and what they can do about it.
 *
 * The header used to show a hardcoded "Admin User / Administrator" beside a
 * menu whose three items all did nothing — including Sign out. This shows who
 * is actually signed in, opens their real profile, and signs them out for
 * real.
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const { user, signOut, allows } = useAuth()
  const navigate = useNavigate()

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

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <div ref={rootRef} className="relative hidden items-center gap-2.5 border-l border-line pl-3.5 sm:flex">
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brand-800 text-[12px] font-bold text-gold-300">
          {initials}
        </span>

        <div className="leading-tight">
          <p className="max-w-[140px] truncate text-[12.5px] font-bold text-ink">{user.name}</p>
          <p className="text-[10.5px] text-ink-muted">{roleLabels[user.role]}</p>
        </div>

        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          className="focus-ring rounded p-0.5 text-ink-muted transition hover:text-ink"
        >
          <ChevronDown className={cn('size-4 transition', open && 'rotate-180')} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] z-30 w-[210px] animate-scale-in overflow-hidden rounded-[10px] border border-line bg-white py-1 shadow-pop"
          >
            <div className="border-b border-line px-3.5 pb-2 pt-1.5">
              <p className="truncate text-[12px] font-bold text-ink">{user.name}</p>
              <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
            </div>

            <MenuItem
              icon={<UserRound className="size-[14px]" />}
              label="My profile"
              onClick={() => {
                setOpen(false)
                setProfileOpen(true)
              }}
            />

            {allows('view:settings') && (
              <MenuItem
                icon={<Settings className="size-[14px]" />}
                label="Settings"
                onClick={() => {
                  setOpen(false)
                  navigate('/admin/settings')
                }}
              />
            )}

            {allows('view:platform') && (
              <MenuItem
                icon={<ShieldCheck className="size-[14px]" />}
                label="Control centre"
                onClick={() => {
                  setOpen(false)
                  navigate('/superadmin')
                }}
              />
            )}

            <div className="my-1 border-t border-line" />

            <MenuItem
              icon={<LogOut className="size-[14px]" />}
              label="Sign out"
              danger
              onClick={() => {
                setOpen(false)
                signOut()
                navigate('/login', { replace: true })
              }}
            />
          </div>
        )}
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12.5px] transition',
        danger ? 'text-state-danger hover:bg-state-dangerBg' : 'text-ink-soft hover:bg-line-soft',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

/**
 * Profile details and a password change.
 *
 * Name, email and role are read-only here: changing who someone is belongs in
 * user management, where the last-super-admin guard lives. The password is the
 * one thing a person should always be able to change themselves.
 */
function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, allows } = useAuth()
  const { push } = useToast()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setErrors({})
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== confirm) {
      setErrors({ confirm: 'The two passwords do not match.' })
      return
    }

    setSaving(true)
    try {
      const result = await api.post<{ otherSessionsEnded: number }>('/auth/change-password', {
        currentPassword: current,
        password: next,
      })
      push({
        tone: 'success',
        title: 'Password changed',
        detail: result.otherSessionsEnded
          ? `Signed out of ${result.otherSessionsEnded} other device(s).`
          : 'Use it the next time you sign in.',
      })
      reset()
      onClose()
    } catch (err) {
      const details = fieldErrorsOf(err)
      setErrors(Object.keys(details).length ? details : { currentPassword: messageOf(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="My profile"
      subtitle="Your account details and the permissions your role carries."
    >
      <div className="grid gap-4">
        <dl className="grid gap-px overflow-hidden rounded-[10px] border border-line bg-line">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Role" value={roleLabels[user.role]} />
          <Row
            label="Permissions"
            value={`${user.permissions?.length ?? 0} granted to this role`}
          />
        </dl>

        {/* Only the platform tier can see the full matrix. */}
        {allows('manage:roles') && (
          <p className="text-[11.5px] text-ink-muted">
            The full matrix is on Control centre → Roles &amp; permissions.
          </p>
        )}

        <form onSubmit={submit} className="grid gap-3 border-t border-line pt-4">
          <p className="text-[12.5px] font-bold text-ink">
            <KeyRound className="mr-1.5 inline size-[13px] text-brand-700" />
            Change password
          </p>

          <div>
            <Label htmlFor="pw-current" required>
              Current password
            </Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              error={errors.currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <FieldError>{errors.currentPassword}</FieldError>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pw-next" required>
                New password
              </Label>
              <Input
                id="pw-next"
                type="password"
                autoComplete="new-password"
                value={next}
                error={errors.password}
                onChange={(e) => setNext(e.target.value)}
              />
              <FieldError>{errors.password}</FieldError>
            </div>
            <div>
              <Label htmlFor="pw-confirm" required>
                Confirm new password
              </Label>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                error={errors.confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <FieldError>{errors.confirm}</FieldError>
            </div>
          </div>

          <p className="text-[11.5px] text-ink-muted">
            Changing your password signs you out on every other device.
          </p>

          <Button type="submit" disabled={saving || !current || !next}>
            {saving ? 'Saving…' : 'Change password'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
      <dt className="text-[12px] text-ink-muted">{label}</dt>
      <dd className="truncate text-[12.5px] font-semibold text-ink">{value}</dd>
    </div>
  )
}

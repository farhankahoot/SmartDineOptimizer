import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { cn } from '@/lib/cn'

const rules = [
  { id: 'len', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'case', label: 'One uppercase and one lowercase letter', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: 'num', label: 'At least one number', test: (v: string) => /\d/.test(v) },
]

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!rules.every((r) => r.test(password))) next.password = 'Password does not meet all requirements.'
    if (!confirm) next.confirm = 'Confirm your new password.'
    else if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    await new Promise((r) => setTimeout(r, 700))
    setBusy(false)
    setDone(true)
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Set a password you have not used before.">
      {done ? (
        <div className="grid gap-4">
          <div className="flex gap-3 rounded-[10px] border border-state-success/25 bg-[#F1F9F3] px-3.5 py-3">
            <CheckCircle2 className="mt-px size-[18px] shrink-0 text-state-success" />
            <div>
              <p className="text-[13px] font-bold text-ink">Password updated</p>
              <p className="mt-1 text-[12px] text-ink-soft">
                You can now sign in to the console with your new password.
              </p>
            </div>
          </div>
          <Button size="lg" block onClick={() => navigate('/login')}>
            Continue to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div>
            <Label htmlFor="rp-pass" required>
              New password
            </Label>
            <Input
              id="rp-pass"
              type="password"
              autoComplete="new-password"
              icon={<Lock />}
              placeholder="Enter a new password"
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FieldError>{errors.password}</FieldError>

            <ul className="mt-2.5 grid gap-1">
              {rules.map((r) => {
                const ok = r.test(password)
                return (
                  <li
                    key={r.id}
                    className={cn(
                      'flex items-center gap-1.5 text-[11.5px]',
                      ok ? 'text-state-success' : 'text-ink-faint',
                    )}
                  >
                    <span
                      className={cn(
                        'size-[6px] rounded-full',
                        ok ? 'bg-state-success' : 'bg-[#D4D4DA]',
                      )}
                    />
                    {r.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <Label htmlFor="rp-confirm" required>
              Confirm password
            </Label>
            <Input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              icon={<Lock />}
              placeholder="Re-enter the new password"
              value={confirm}
              error={errors.confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <FieldError>{errors.confirm}</FieldError>
          </div>

          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-[16px] animate-spin" /> Updating…
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-[14px]" /> Back to sign in
      </Link>
    </AuthShell>
  )
}

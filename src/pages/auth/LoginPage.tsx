import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { useAuth } from '@/auth/AuthContext'
import { systemUsers } from '@/data/users'

const demoAccounts = systemUsers.filter((u) => u.status === 'Active').slice(0, 3)

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={location.state?.from ?? '/admin'} replace />

  const validate = () => {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setBusy(true)
    try {
      await signIn(email, password)
      navigate(location.state?.from ?? '/admin', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Sign in to the console"
      subtitle="Restaurant administrators and authorised staff only."
      footer={
        <div className="rounded-[10px] border border-line bg-white p-3.5">
          <p className="text-[11.5px] font-bold text-ink">Demo accounts</p>
          <ul className="mt-2 grid gap-1.5">
            {demoAccounts.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 text-[11.5px]">
                <span className="text-ink-muted">
                  {u.email} · <span className="font-semibold text-ink-soft">{u.password}</span>
                </span>
                <button
                  type="button"
                  className="focus-ring shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold text-brand-700 hover:bg-brand-50"
                  onClick={() => {
                    setEmail(u.email)
                    setPassword(u.password)
                    setErrors({})
                    setFormError('')
                  }}
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[9px] border border-state-danger/25 bg-state-dangerBg px-3 py-2.5"
          >
            <AlertCircle className="mt-px size-[15px] shrink-0 text-state-danger" />
            <p className="text-[12px] text-ink-soft">{formError}</p>
          </div>
        )}

        <div>
          <Label htmlFor="login-email" required>
            Email address
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            icon={<Mail />}
            placeholder="you@asianwok.pk"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError>{errors.email}</FieldError>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="login-password" required>
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="mb-1.5 text-[11.5px] font-semibold text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            icon={<Lock />}
            placeholder="Enter your password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            className="focus-ring relative float-right -mt-[31px] mr-3 rounded p-0.5 text-ink-faint transition hover:text-ink"
          >
            {showPassword ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
          </button>
          <FieldError>{errors.password}</FieldError>
        </div>

        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-[16px] animate-spin" /> Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

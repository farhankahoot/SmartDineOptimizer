import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('Enter a valid email address.')

    setError('')
    setBusy(true)
    await new Promise((r) => setTimeout(r, 700))
    setBusy(false)
    setSent(true)
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to choose a new password."
    >
      {sent ? (
        <div className="grid gap-4">
          <div className="flex gap-3 rounded-[10px] border border-state-success/25 bg-[#F1F9F3] px-3.5 py-3">
            <CheckCircle2 className="mt-px size-[18px] shrink-0 text-state-success" />
            <div>
              <p className="text-[13px] font-bold text-ink">Check your inbox</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                If an account exists for <span className="font-semibold">{email}</span>, a reset link
                is on its way. The link expires in 30 minutes.
              </p>
            </div>
          </div>

          <Button variant="outline" size="lg" block onClick={() => setSent(false)}>
            Use a different email
          </Button>

          <Link
            to="/reset-password"
            className="text-center text-[11.5px] font-semibold text-brand-700 hover:underline"
          >
            Open the reset form (demo)
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div>
            <Label htmlFor="fp-email" required>
              Email address
            </Label>
            <Input
              id="fp-email"
              type="email"
              icon={<Mail />}
              placeholder="you@asianwok.pk"
              value={email}
              error={error}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError>{error}</FieldError>
          </div>

          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-[16px] animate-spin" /> Sending link…
              </>
            ) : (
              'Send reset link'
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

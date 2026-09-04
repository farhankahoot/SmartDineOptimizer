import { Link } from 'react-router-dom'
import { ArrowLeft, LayoutGrid, ShieldOff } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthContext'
import { roleLabels } from '@/data/users'

/** 403 — signed in, but the role does not carry this permission. */
export function ForbiddenPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-page px-5 py-16 text-center">
      <div className="rounded-[12px] bg-sidebar px-5 py-4">
        <BrandLogo scale={0.9} />
      </div>

      <span className="mt-8 flex size-14 items-center justify-center rounded-full bg-state-dangerBg text-state-danger">
        <ShieldOff className="size-7" strokeWidth={1.8} />
      </span>

      <p className="mt-5 text-[13px] font-bold uppercase tracking-[0.08em] text-brand-700">
        403 — Not authorised
      </p>
      <h1 className="mt-2 text-[22px] font-extrabold text-ink">
        Your role can&apos;t open this page
      </h1>
      <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-ink-muted">
        {user
          ? `You are signed in as ${user.name} (${roleLabels[user.role]}). Ask an administrator to grant the permission, or switch to an account that has it.`
          : 'Sign in with an account that has permission for this area.'}
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link to="/admin">
          <Button size="lg" leftIcon={<LayoutGrid className="size-[16px]" />}>
            Back to the console
          </Button>
        </Link>
        <Button size="lg" variant="outline" onClick={signOut}>
          Sign in as someone else
        </Button>
        <Link to="/">
          <Button size="lg" variant="outlineNeutral" leftIcon={<ArrowLeft className="size-[16px]" />}>
            Public site
          </Button>
        </Link>
      </div>
    </div>
  )
}

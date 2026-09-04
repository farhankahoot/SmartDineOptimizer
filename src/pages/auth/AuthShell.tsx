import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarCheck, ShieldCheck } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'

const highlights = [
  { icon: CalendarCheck, title: 'Reservation control', detail: 'Confirm, update or cancel bookings from one worklist.' },
  { icon: BarChart3, title: 'Predictive operations', detail: 'Footfall, revenue, food and staffing forecasts in real time.' },
  { icon: ShieldCheck, title: 'Role-based access', detail: 'Admin, manager and staff each see only what they need.' },
]

/** Shared split layout for sign-in, forgot-password and reset-password. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-full lg:grid-cols-[1fr_minmax(0,520px)]">
      {/* Brand panel */}
      <aside className="sidebar-fill relative hidden overflow-hidden p-10 lg:flex lg:flex-col">
        <div
          className="absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(closest-side at 25% 20%, rgba(232,186,104,.22), transparent 62%), radial-gradient(closest-side at 80% 70%, rgba(122,17,19,.45), transparent 65%)',
          }}
        />

        <div className="relative z-10">
          <BrandLogo />
        </div>

        <div className="relative z-10 mt-auto max-w-[460px]">
          <h2 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-white">
            Smart&#8203;Dine Optimizer
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-white/75">
            A plug-and-play restaurant reservation and ML-based predictive operations management
            system.
          </p>

          <ul className="mt-8 grid gap-4">
            {highlights.map(({ icon: Icon, title: t, detail }) => (
              <li key={t} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-gold-600/50 text-gold-400">
                  <Icon className="size-[17px]" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white">{t}</p>
                  <p className="mt-0.5 text-[12px] text-white/65">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-10 text-[11px] text-white/45">
          COMSATS University Islamabad · Session 2023–2027
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center bg-page px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex rounded-[10px] bg-sidebar px-4 py-3">
              <BrandLogo scale={0.8} />
            </div>
          </div>

          <h1 className="text-[24px] font-extrabold tracking-[-0.015em] text-ink">{title}</h1>
          <p className="mt-1.5 text-[13px] text-ink-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-6">{footer}</div>}

          <p className="mt-10 text-center text-[11.5px] text-ink-faint">
            Looking to book a table?{' '}
            <Link to="/reserve" className="font-semibold text-brand-700 hover:underline">
              Go to the reservation page
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BrandLogo } from './BrandLogo'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Reservation', to: '/reserve' },
  { label: 'Track Booking', to: '/track' },
  { label: 'Feedback', to: '/' },
]

/** Dark restaurant-site header shared by the booking page and the tracker. */
export function PublicHeader({ activeLabel }: { activeLabel: string }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="relative z-20 border-b border-white/10">
      <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-5 py-2.5">
        <Link to="/" aria-label="Asian Wok home">
          <BrandLogo scale={0.86} />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 lg:flex">
          {navLinks.map((l) => {
            const active = l.label === activeLabel || (l.to !== '/' && pathname === l.to)
            return (
              <Link
                key={l.label}
                to={l.to}
                className={cn(
                  'relative py-1.5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition',
                  active ? 'text-white' : 'text-white/80 hover:text-white',
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-gold-400" />
                )}
              </Link>
            )
          })}
        </nav>

        <a
          href="tel:03331234567"
          className="ml-auto hidden items-center gap-2 text-[13px] font-semibold text-white lg:ml-7 lg:flex"
        >
          <Phone className="size-[14px]" />
          0333 1234567
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="focus-ring ml-auto rounded-lg p-2 text-white lg:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav className="relative z-20 grid gap-1 border-t border-white/10 bg-[#150E09]/95 px-5 py-3 lg:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-[13px] font-bold uppercase tracking-[0.04em] text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="tel:03331234567"
            className="mt-1 flex items-center gap-2 px-2 py-2 text-[13px] font-semibold text-gold-300"
          >
            <Phone className="size-[14px]" /> 0333 1234567
          </a>
        </nav>
      )}
    </header>
  )
}

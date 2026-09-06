import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useNavIndicator } from './useNavIndicator'
import { BrandLogo } from './BrandLogo'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Reservation', to: '/reserve' },
  { label: 'Track Booking', to: '/track' },
  { label: 'Feedback', to: '/feedback' },
]

/** Dark restaurant-site header shared by the booking page and the tracker. */
export function PublicHeader({ activeLabel }: { activeLabel: string }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // The current page, matched the same way the links decide their own state.
  const activeKey =
    navLinks.find((l) => l.label === activeLabel || (l.to !== '/' && pathname === l.to))?.label ??
    null
  const { containerRef, registerItem, indicator } = useNavIndicator(activeKey)

  return (
    <header className="relative z-20 border-b border-white/10">
      <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-5 py-2.5">
        <Link to="/" aria-label="Asian Wok home">
          <BrandLogo scale={0.86} />
        </Link>

        <nav
          ref={containerRef as React.RefObject<HTMLElement>}
          className="relative ml-auto hidden items-center gap-7 lg:flex"
        >
          {navLinks.map((l) => {
            const active = l.label === activeKey
            return (
              <Link
                key={l.label}
                ref={registerItem(l.label)}
                to={l.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring relative rounded py-1.5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-colors duration-200',
                  active ? 'text-white' : 'text-white/70 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            )
          })}

          {/* One bar that travels, matching the landing page. */}
          <span
            aria-hidden="true"
            style={{ left: indicator.left, width: indicator.width }}
            className={cn(
              'pointer-events-none absolute -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-gold-400 to-brand-bright',
              'motion-safe:transition-[left,width,opacity] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.4,0,.2,1)]',
              indicator.ready && indicator.width > 0 ? 'opacity-100' : 'opacity-0',
            )}
          />
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
          {navLinks.map((l) => {
            const active = l.label === activeKey
            return (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-bold uppercase tracking-[0.04em] transition',
                  active ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'h-3.5 w-[3px] rounded-full transition-colors',
                    active ? 'bg-gold-400' : 'bg-transparent',
                  )}
                />
                {l.label}
              </Link>
            )
          })}
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

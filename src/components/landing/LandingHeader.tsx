import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LogIn, Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { useNavIndicator, useSectionSpy } from '@/components/layout/useNavIndicator'

/**
 * Written for a diner, not a buyer.
 *
 * Every entry matches a real section id — three of the previous six pointed at
 * anchors that no longer existed, so clicking them scrolled nowhere.
 */
const sections = [
  { label: 'Book a table', id: 'booking' },
  { label: 'How it works', id: 'how' },
  { label: 'Menus & occasions', id: 'deals' },
  { label: 'Our restaurants', id: 'restaurants' },
  { label: 'Questions', id: 'faq' },
]

const sectionIds = sections.map((s) => s.id)

/** Sticky navigation for the public site. */
export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const activeId = useSectionSpy(sectionIds)
  const { containerRef, registerItem, indicator } = useNavIndicator(activeId)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The mobile sheet must not leave the page scrollable behind it.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-b border-white/10 bg-[#0C0C0E]/80 shadow-[0_1px_24px_rgba(0,0,0,.5)] backdrop-blur-xl'
          : 'border-b border-transparent bg-[#0C0C0E]',
      )}
    >
      {/* Hairline that warms up as the page scrolls under the bar. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent transition-opacity duration-500',
          scrolled ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-6 px-5">
        <Link to="/" aria-label="Asian Wok home" className="focus-ring shrink-0 rounded">
          <BrandLogo scale={0.8} />
        </Link>

        <nav
          aria-label="Main"
          ref={containerRef as React.RefObject<HTMLElement>}
          className="relative ml-2 hidden h-full items-center gap-7 lg:flex"
        >
          {sections.map((s) => {
            const active = activeId === s.id
            return (
              <a
                key={s.id}
                ref={registerItem(s.id)}
                href={`#${s.id}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'focus-ring relative rounded text-[13px] font-semibold transition-colors duration-200',
                  active ? 'text-white' : 'text-white/65 hover:text-white',
                )}
              >
                {s.label}
              </a>
            )
          })}

          {/*
            One bar that slides between items. Width is animated too, so it
            stretches into the next label rather than jumping.
          */}
          <span
            aria-hidden="true"
            style={{ left: indicator.left, width: indicator.width }}
            className={cn(
              'pointer-events-none absolute bottom-[18px] h-[2px] rounded-full bg-gradient-to-r from-gold-400 to-brand-bright',
              'motion-safe:transition-[left,width,opacity] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.4,0,.2,1)]',
              indicator.ready && indicator.width > 0 ? 'opacity-100' : 'opacity-0',
            )}
          />
        </nav>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <a
            href="tel:03331234567"
            className="focus-ring mr-2 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-[12.5px] font-semibold text-white/70 transition hover:text-white"
          >
            <Phone className="size-[14px] text-gold-400" strokeWidth={2} />
            0333 1234567
          </a>

          <Link
            to="/login"
            className="focus-ring inline-flex h-[38px] items-center gap-2 rounded-full px-4 text-[12.5px] font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white"
          >
            <LogIn className="size-[14px]" />
            Staff log in
          </Link>

          <Link
            to="/reserve"
            className="group focus-ring inline-flex h-[38px] items-center gap-1.5 rounded-full bg-brand-bright px-5 text-[12.5px] font-bold text-white shadow-[0_4px_16px_rgba(192,22,26,.35)] transition hover:bg-brand-600"
          >
            Reserve a table
            <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="landing-mobile-nav"
          className="focus-ring ml-auto rounded-lg p-2 text-white lg:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="landing-mobile-nav"
          aria-label="Mobile"
          className="animate-scale-in origin-top border-t border-white/10 bg-[#0C0C0E] px-5 pb-4 pt-2 lg:hidden"
        >
          <ul className="grid gap-0.5">
            {sections.map((s) => {
              const active = activeId === s.id
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'focus-ring flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-[14px] font-semibold transition',
                      active ? 'bg-white/[0.07] text-white' : 'text-white/80 hover:bg-white/5',
                    )}
                  >
                    {/* The bar cannot slide on a stacked list, so each row carries its own. */}
                    <span
                      className={cn(
                        'h-4 w-[3px] rounded-full transition-colors',
                        active ? 'bg-gold-400' : 'bg-transparent',
                      )}
                    />
                    {s.label}
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
            <Link
              to="/reserve"
              onClick={() => setOpen(false)}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full bg-brand-bright text-[14px] font-bold text-white"
            >
              Reserve a table
              <ArrowRight className="size-[15px]" />
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-white/20 text-[14px] font-semibold text-white"
            >
              <LogIn className="size-[15px]" />
              Staff log in
            </Link>
            <a
              href="tel:03331234567"
              className="mt-1 inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white/70"
            >
              <Phone className="size-[14px] text-gold-400" />
              0333 1234567
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}

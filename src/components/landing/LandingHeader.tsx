import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/Button'

const sections = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Restaurants', href: '#restaurants' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'FAQ', href: '#faq' },
]

/** Sticky marketing navigation for the public site. */
export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        scrolled ? 'border-white/10 bg-[#0C0C0E]/95 backdrop-blur' : 'border-transparent bg-[#0C0C0E]',
      )}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-5 py-3">
        <Link to="/" aria-label="SmartDine Optimizer home" className="focus-ring rounded">
          <BrandLogo scale={0.8} />
        </Link>

        <nav aria-label="Main" className="ml-2 hidden items-center gap-6 lg:flex">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="focus-ring rounded py-1 text-[13px] font-semibold text-white/75 transition hover:text-white"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 lg:flex">
          <Link to="/login" className="focus-ring rounded-lg">
            <Button variant="ghost" className="text-white/85 hover:bg-white/10 hover:text-white" leftIcon={<LogIn className="size-[15px]" />}>
              Staff log in
            </Button>
          </Link>
          <Link to="/reserve" className="focus-ring rounded-lg">
            <Button>Reserve a table</Button>
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
          className="border-t border-white/10 bg-[#0C0C0E] px-5 pb-4 pt-2 lg:hidden"
        >
          <ul className="grid gap-0.5">
            {sections.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className="focus-ring block rounded-lg px-2 py-2.5 text-[14px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
            <Link to="/reserve" onClick={() => setOpen(false)}>
              <Button block size="lg">
                Reserve a table
              </Button>
            </Link>
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button
                block
                size="lg"
                variant="outlineNeutral"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Staff log in
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

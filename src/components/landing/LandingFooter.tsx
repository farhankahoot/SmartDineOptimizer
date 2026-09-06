import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { defaultProfile } from '@/data/settings'
import { cn } from '@/lib/cn'

interface FooterLink {
  label: string
  /** Internal route, or an in-page anchor on the landing page. */
  to?: string
  href?: string
}

/**
 * Every anchor points at a section that exists.
 *
 * The previous list still referenced the old marketing layout — #product,
 * #features, #how-it-works and #analytics were all removed when the page was
 * rewritten for guests, so four of the six links scrolled nowhere.
 */
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Book',
    links: [
      { label: 'Reserve a table', to: '/reserve' },
      { label: 'Check my booking', to: '/track' },
      { label: 'How it works', href: '#how' },
      { label: 'Menus & occasions', href: '#deals' },
    ],
  },
  {
    title: 'About us',
    links: [
      { label: 'Booking with us', href: '#booking' },
      { label: 'Our restaurants', href: '#restaurants' },
      { label: 'Common questions', href: '#faq' },
      { label: 'Leave feedback', to: '/feedback' },
    ],
  },
  {
    title: 'Restaurant team',
    links: [
      { label: 'Staff sign in', to: '/login' },
      { label: 'Reset password', to: '/forgot-password' },
    ],
  },
]

export interface FooterProfile {
  name: string
  cuisine: string
  phone: string
  email: string
  address: string
  city: string
}

/**
 * Contact details come from the restaurant's saved profile where the page has
 * loaded it, so changing the address in Settings changes it here too. The
 * fixture is only a fallback for the moment before that request lands.
 */
export function LandingFooter({
  profile,
  hours,
}: {
  profile?: FooterProfile
  hours?: { day: string; open: string; close: string; closed: boolean }[]
}) {
  const p = profile ?? defaultProfile
  const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
  const today = hours?.find((h) => h.day === todayName)

  return (
    <footer className="sidebar-fill border-t border-white/10">
      <div className="mx-auto max-w-[1240px] px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <BrandLogo scale={0.9} />
            <p className="mt-4 max-w-[320px] text-[12.5px] leading-relaxed text-white/65">
              {p.cuisine ? `${p.cuisine} dining in ${p.city}. ` : ''}Reserve your table online, pick
              where you would like to sit, and check your booking any time.
            </p>

            <ul className="mt-5 grid gap-2 text-[12px] text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="size-[14px] shrink-0 text-gold-400" />
                <a
                  href={`tel:${p.phone.replace(/\s/g, '')}`}
                  className="focus-ring rounded transition hover:text-white"
                >
                  {p.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-[14px] shrink-0 text-gold-400" />
                <a
                  href={`mailto:${p.email}`}
                  className="focus-ring rounded transition hover:text-white"
                >
                  {p.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-px size-[14px] shrink-0 text-gold-400" />
                {/* Opens the address in whichever map app the visitor uses. */}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${p.address}, ${p.city}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring rounded transition hover:text-white"
                >
                  {p.address}, {p.city}
                </a>
              </li>
              {today && (
                <li className="flex items-center gap-2">
                  <Clock className="size-[14px] shrink-0 text-gold-400" />
                  <span>
                    {today.closed
                      ? `Closed ${todayName}`
                      : `Open today ${today.open} – ${today.close}`}
                  </span>
                </li>
              )}
            </ul>

            <Link
              to="/reserve"
              className="group focus-ring mt-6 inline-flex h-[40px] items-center gap-2 rounded-full bg-brand-bright px-5 text-[12.5px] font-bold text-white transition hover:bg-brand-600"
            >
              Reserve a table
              <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-gold-400">
                {col.title}
              </h2>
              <ul className="mt-3.5 grid gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className={linkClass}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={linkClass}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[11.5px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {p.name} · Powered by SmartDine Optimizer
          </p>
          <p>
            Final year project · COMSATS University Islamabad · BS Business Data Analytics, Session
            2023–2027
          </p>
        </div>
      </div>
    </footer>
  )
}

const linkClass = cn(
  'focus-ring inline-block rounded text-[12.5px] text-white/70 transition',
  'hover:translate-x-0.5 hover:text-white',
)

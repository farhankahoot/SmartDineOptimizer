import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { defaultProfile } from '@/data/settings'

interface FooterLink {
  label: string
  /** Internal route, or an in-page anchor. */
  to?: string
  href?: string
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '#product' },
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Restaurants', href: '#restaurants' },
      { label: 'Analytics & prediction', href: '#analytics' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'For guests',
    links: [
      { label: 'Reserve a table', to: '/reserve' },
      { label: 'Track a booking', to: '/track' },
    ],
  },
  {
    title: 'For the restaurant',
    links: [
      { label: 'Staff log in', to: '/login' },
      { label: 'Reset password', to: '/forgot-password' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="sidebar-fill border-t border-white/10">
      <div className="mx-auto max-w-[1240px] px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <BrandLogo scale={0.9} />
            <p className="mt-4 max-w-[320px] text-[12.5px] leading-relaxed text-white/65">
              A plug-and-play restaurant reservation and ML-based predictive operations management
              system, built for premium dine-in restaurants.
            </p>

            <ul className="mt-5 grid gap-2 text-[12px] text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="size-[14px] shrink-0 text-gold-400" />
                <a href={`tel:${defaultProfile.phone.replace(/\s/g, '')}`} className="hover:text-white">
                  {defaultProfile.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-[14px] shrink-0 text-gold-400" />
                <a href={`mailto:${defaultProfile.email}`} className="hover:text-white">
                  {defaultProfile.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-px size-[14px] shrink-0 text-gold-400" />
                <span>
                  {defaultProfile.address}, {defaultProfile.city}
                </span>
              </li>
            </ul>
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
                      <Link
                        to={l.to}
                        className="focus-ring rounded text-[12.5px] text-white/70 transition hover:text-white"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="focus-ring rounded text-[12.5px] text-white/70 transition hover:text-white"
                      >
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
          <p>© {new Date().getFullYear()} SmartDine Optimizer · {defaultProfile.name}</p>
          <p>
            Final year project · COMSATS University Islamabad · BS Business Data Analytics, Session
            2023–2027
          </p>
        </div>
      </div>
    </footer>
  )
}

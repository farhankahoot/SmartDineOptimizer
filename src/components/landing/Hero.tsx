import { Link } from 'react-router-dom'
import { Clock, MapPin, Phone, Search, Star } from 'lucide-react'
import { Reveal } from './Reveal'
import {
  BookingStarter,
  type AvailabilityPayload,
  type BookingPicker,
} from './BookingStarter'

/**
 * The hero.
 *
 * Split rather than centred, because the two halves do different jobs: the
 * left says where you are and why you would book, the right *is* the booking.
 * A centred column of text over a gradient looks like every other landing page
 * and asks the visitor to scroll before they can do anything; putting the live
 * availability widget above the fold means the first screen already answers
 * "can I get a table at eight?".
 */
export function Hero({
  bookingOpen,
  profile,
  openToday,
  picker,
  availability,
  availabilityLoading,
  titleAccent,
  subtitle,
}: {
  bookingOpen: boolean
  profile?: {
    name: string
    tagline: string
    cuisine: string
    address: string
    city: string
    phone: string
  }
  openToday?: { open: string; close: string; closed: boolean }
  picker: BookingPicker
  availability: AvailabilityPayload | null
  availabilityLoading: boolean
  /** Editable in the Control Centre — Landing Page › Hero. */
  titleAccent: string
  subtitle: string
}) {
  const name = profile?.name ?? 'Asian Wok'

  return (
    <section className="relative isolate overflow-hidden bg-[#0C0C0E]">
      <Aurora />

      <div className="relative mx-auto max-w-[1180px] px-5 pb-16 pt-14 lg:pb-24 lg:pt-20">
        {/*
          Explicit grid placement rather than plain source order.

          On a phone the booking card has to sit immediately under the
          headline — it is the reason the page exists, and burying it below
          four lines of copy, the opening hours and the address put it most of
          a screen out of reach. Desktop stacks the pitch and those details in
          the left column with the card spanning both rows beside them, which
          source order alone cannot express.
        */}
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* ------------------------------------------------------ the pitch */}
          <div className="order-1 max-w-[580px] lg:col-start-1 lg:row-start-1 lg:self-end">
            <Reveal variant="scale">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/[0.07] px-3.5 py-1.5 text-[11.5px] font-semibold text-gold-300 backdrop-blur-sm">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full rounded-full bg-gold-400 motion-safe:animate-ping-soft" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-gold-400" />
                </span>
                {profile?.cuisine ?? 'Pan Asian'} · {profile?.city ?? 'Islamabad'}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-balance text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white sm:text-[52px]">
                A table at {name},{' '}
                {/*
                  The break is desktop-only. Forcing it on a phone left "want."
                  alone on a fourth line; without it the browser balances the
                  whole sentence across the narrow column instead.
                */}
                <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-brand-400 bg-clip-text text-transparent">
                  {titleAccent}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p className="mt-5 max-w-[480px] text-pretty text-[15px] leading-relaxed text-white/65">
                {subtitle}
              </p>
            </Reveal>

          </div>

          {/* --------------------------------------------------- the booking */}
          <Reveal
            variant="scale"
            delay={120}
            className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
          >
            <BookingStarter
              picker={picker}
              availability={availability}
              loading={availabilityLoading}
              bookingOpen={bookingOpen}
            />
          </Reveal>

          {/* ------------------------------ practical detail, and second doors */}
          <div className="order-3 max-w-[580px] lg:col-start-1 lg:row-start-2 lg:self-start">
            <Reveal delay={220}>
              <ul className="grid gap-3 text-[13px] text-white/65 sm:grid-cols-2">
                <li className="flex items-center gap-2.5">
                  <Clock className="size-[15px] shrink-0 text-gold-400" strokeWidth={2} />
                  {openToday && !openToday.closed
                    ? `Open today ${openToday.open} – ${openToday.close}`
                    : openToday?.closed
                      ? 'Closed today'
                      : 'Open daily'}
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="size-[15px] shrink-0 text-gold-400" strokeWidth={2} />
                  <span className="truncate">
                    {profile?.address ?? 'Pir Sohawa Road, Margalla Hills'}
                  </span>
                </li>
                {profile?.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-[15px] shrink-0 text-gold-400" strokeWidth={2} />
                    <a
                      href={`tel:${profile.phone.replace(/\s/g, '')}`}
                      className="focus-ring rounded transition hover:text-white"
                    >
                      {profile.phone}
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-2.5">
                  <Star className="size-[15px] shrink-0 text-gold-400" strokeWidth={2} />
                  Walk-ins welcome, booked tables first
                </li>
              </ul>
            </Reveal>

            <Reveal delay={290}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  to="/track"
                  className="focus-ring group inline-flex items-center gap-2 rounded text-[13.5px] font-semibold text-white/80 transition hover:text-white"
                >
                  <Search className="size-[15px] text-gold-400" strokeWidth={2} />
                  <span className="border-b border-white/25 pb-0.5 transition group-hover:border-gold-400">
                    Check an existing booking
                  </span>
                </Link>
                <a
                  href="#deals"
                  className="focus-ring group inline-flex items-center gap-2 rounded text-[13.5px] font-semibold text-white/80 transition hover:text-white"
                >
                  <span className="border-b border-white/25 pb-0.5 transition group-hover:border-gold-400">
                    See set menus
                  </span>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Slow-drifting colour behind the hero.
 *
 * Three blurred blooms in the brand palette over a faint grid. Hidden from
 * assistive technology, and still for anyone who prefers reduced motion.
 */
function Aurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0C0C0E]" />

      <div className="absolute -left-[18%] -top-[28%] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(122,17,19,.55),transparent_65%)] blur-[70px] motion-safe:animate-aurora" />
      <div
        className="absolute -right-[14%] top-[6%] size-[540px] rounded-full bg-[radial-gradient(circle,rgba(192,22,26,.34),transparent_66%)] blur-[80px] motion-safe:animate-aurora"
        style={{ animationDelay: '-7s' }}
      />
      <div
        className="absolute bottom-[-30%] left-[26%] size-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,165,55,.16),transparent_68%)] blur-[90px] motion-safe:animate-aurora"
        style={{ animationDelay: '-13s' }}
      />

      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '58px 58px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)',
        }}
      />

      {/*
        No fade at the foot of the hero.

        It faded to the cream page colour while the band directly below is
        white, so the two never met — the mismatch rendered as a grey smear
        across the full width. The hero now ends on its own dark, against the
        fact strip's top border, which reads as a deliberate edge.
      */}
    </div>
  )
}

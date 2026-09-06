import { Link } from 'react-router-dom'
import { ArrowRight, Clock, LayoutGrid, Lock, MapPin, Phone, Search } from 'lucide-react'
import { Reveal } from './Reveal'

/**
 * The hero, written for a diner.
 *
 * This page is the restaurant's own website, so the person arriving wants a
 * table — not a description of the software running behind it. The promise,
 * the reassurances and the buttons are all about getting them booked.
 */
export function Hero({
  bookingOpen,
  profile,
  openToday,
}: {
  bookingOpen: boolean
  profile?: { name: string; tagline: string; cuisine: string; address: string; city: string; phone: string }
  openToday?: { open: string; close: string; closed: boolean }
}) {
  const name = profile?.name ?? 'Asian Wok'

  return (
    <section className="relative isolate overflow-hidden bg-[#0C0C0E]">
      <Aurora />

      <div className="relative mx-auto max-w-[1180px] px-5 pb-20 pt-16 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-[760px] text-center">
          <Reveal variant="scale">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/[0.07] px-3.5 py-1.5 text-[11.5px] font-semibold text-gold-300 backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-gold-400 motion-safe:animate-ping-soft" />
                <span className="relative inline-flex size-1.5 rounded-full bg-gold-400" />
              </span>
              {profile?.cuisine ?? 'Pan Asian'} · {profile?.city ?? 'Islamabad'}
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-balance text-[38px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white sm:text-[54px] lg:text-[62px]">
              Your table at {name},
              <br />
              <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-brand-400 bg-clip-text text-transparent">
                booked in a minute.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mx-auto mt-6 max-w-[560px] text-pretty text-[15px] leading-relaxed text-white/65">
              Choose your date, your time and the table you actually want to sit at — then get a
              booking reference you can check any time. No phone calls, no waiting to hear back.
            </p>
          </Reveal>

          <Reveal delay={250}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {bookingOpen ? (
                <Link
                  to="/reserve"
                  className="group relative inline-flex h-[50px] items-center gap-2 overflow-hidden rounded-full bg-brand-bright px-8 text-[14px] font-bold text-white shadow-[0_8px_28px_rgba(192,22,26,.4)] transition hover:bg-brand-600"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/20 blur-md motion-safe:animate-sheen"
                  />
                  <span className="relative">Reserve a table</span>
                  <ArrowRight className="relative size-[16px] transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <span className="inline-flex h-[50px] items-center gap-2 rounded-full border border-white/15 px-8 text-[14px] font-semibold text-white/55">
                  <Lock className="size-[15px]" />
                  Online booking is closed
                </span>
              )}

              <Link
                to="/track"
                className="inline-flex h-[50px] items-center gap-2 rounded-full border border-white/18 px-7 text-[14px] font-semibold text-white/85 backdrop-blur-sm transition hover:border-gold-400/50 hover:bg-white/5 hover:text-white"
              >
                <Search className="size-[15px]" />
                Check my booking
              </Link>
            </div>
          </Reveal>

          {/* Practical detail a guest looks for straight away. */}
          <Reveal delay={330}>
            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[12.5px] text-white/60">
              <li className="flex items-center gap-2">
                <Clock className="size-[14px] text-gold-400" strokeWidth={2} />
                {openToday && !openToday.closed
                  ? `Open today ${openToday.open} – ${openToday.close}`
                  : openToday?.closed
                    ? 'Closed today'
                    : 'Open daily'}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-[14px] text-gold-400" strokeWidth={2} />
                {profile?.address ?? 'Pir Sohawa Road, Margalla Hills'}
              </li>
              {profile?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-[14px] text-gold-400" strokeWidth={2} />
                  <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="hover:text-white">
                    {profile.phone}
                  </a>
                </li>
              )}
            </ul>
          </Reveal>

          <Reveal delay={400}>
            <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] text-white/55">
              <LayoutGrid className="size-[14px] text-gold-400" strokeWidth={2} />
              Pick your own table from the live floor plan
            </p>
          </Reveal>
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

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-page" />
    </div>
  )
}

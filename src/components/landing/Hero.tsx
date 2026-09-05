import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, LayoutGrid, LineChart, Lock } from 'lucide-react'
import { Reveal, CountUp } from './Reveal'
import type { LandingContent } from '@/data/platform'
import { objectives } from '@/data/landing'

/**
 * The hero.
 *
 * The four project objectives used to sit in their own band halfway down the
 * page, where they read as a proposal slide. They work harder here as the
 * proof line directly under the promise — same claims, one screen earlier, and
 * one fewer section to scroll past.
 */
export function Hero({ bookingOpen, content }: { bookingOpen: boolean; content: LandingContent }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0C0C0E]">
      <Aurora />

      <div className="relative mx-auto max-w-[1180px] px-5 pb-24 pt-16 lg:pb-32 lg:pt-24">
        <div className="mx-auto max-w-[760px] text-center">
          <Reveal variant="scale">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/[0.07] px-3.5 py-1.5 text-[11.5px] font-semibold text-gold-300 backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-gold-400 motion-safe:animate-ping-soft" />
                <span className="relative inline-flex size-1.5 rounded-full bg-gold-400" />
              </span>
              {content.heroBadge}
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-balance text-[40px] font-extrabold leading-[1.04] tracking-[-0.035em] text-white sm:text-[58px] lg:text-[66px]">
              {content.heroTitleTop}
              <br />
              <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-brand-400 bg-clip-text text-transparent">
                {content.heroTitleAccent}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-[600px] text-pretty text-[14.5px] leading-relaxed text-white/62">
              {content.heroSubtitle}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {bookingOpen ? (
                <Link
                  to="/reserve"
                  className="group relative inline-flex h-[46px] items-center gap-2 overflow-hidden rounded-full bg-brand-bright px-7 text-[13.5px] font-bold text-white shadow-[0_8px_28px_rgba(192,22,26,.4)] transition hover:bg-brand-600"
                >
                  {/* Light sweeping across the primary action. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/20 blur-md motion-safe:animate-sheen"
                  />
                  <span className="relative">{content.primaryCtaLabel}</span>
                  <ArrowRight className="relative size-[15px] transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <span className="inline-flex h-[46px] items-center gap-2 rounded-full border border-white/15 px-7 text-[13.5px] font-semibold text-white/55">
                  <Lock className="size-[15px]" />
                  Online booking is closed
                </span>
              )}

              <a
                href="#product"
                className="inline-flex h-[46px] items-center gap-2 rounded-full border border-white/18 px-7 text-[13.5px] font-semibold text-white/85 backdrop-blur-sm transition hover:border-gold-400/50 hover:bg-white/5 hover:text-white"
              >
                {content.secondaryCtaLabel}
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              {[
                { icon: CalendarCheck, label: 'Book in 1–2 minutes' },
                { icon: LayoutGrid, label: 'Live table availability' },
                { icon: LineChart, label: 'Forecast-led planning' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-[12px] text-white/55">
                  <Icon className="size-[14px] text-gold-400" strokeWidth={2} />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* The project's measurable targets, counting up as they arrive. */}
        <Reveal delay={420}>
          <dl className="mx-auto mt-14 grid max-w-[900px] grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.06] lg:grid-cols-4">
            {objectives.map((o) => (
              <div key={o.label} className="bg-[#0C0C0E]/80 px-5 py-5 text-center backdrop-blur-sm">
                <dt className="text-[24px] font-extrabold leading-none text-gold-400 sm:text-[27px]">
                  <MetricValue metric={o.metric} />
                </dt>
                <dd className="mt-2 text-[11.5px] leading-snug text-white/55">{o.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

/**
 * The objective metrics are written for humans ("1–2 min", "20%"), so a plain
 * count-up cannot handle all of them. A single leading number animates; a
 * range like "1–2 min" is left alone rather than mangled.
 */
function MetricValue({ metric }: { metric: string }) {
  const simple = /^(\d+(?:\.\d+)?)(\D*)$/.exec(metric.trim())
  if (!simple) return <>{metric}</>
  return <CountUp to={Number(simple[1])} suffix={simple[2]} />
}

/**
 * Slow-drifting colour behind the hero.
 *
 * Three blurred radial blooms in the brand palette, layered over a faint grid.
 * They are `aria-hidden` and pause for anyone who prefers reduced motion.
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

      {/* Grid, fading out towards the edges so it never reads as a hard line. */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '58px 58px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)',
        }}
      />

      {/* Blends the hero into the section below it. */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-page" />
    </div>
  )
}

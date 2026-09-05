import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  Database,
  LayoutGrid,
  ListChecks,
  Minus,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { DashboardPreview } from '@/components/landing/ProductPreview'
import { RestaurantShowcase } from '@/components/landing/RestaurantShowcase'
import { Hero } from '@/components/landing/Hero'
import { Reveal } from '@/components/landing/Reveal'
import {
  Eyebrow,
  GlowCard,
  IconTile,
  Section,
  SectionHeading,
} from '@/components/landing/LandingPrimitives'
import { TableIcon } from '@/components/icons/TableIcon'
import { comparison, faqs, modules, problems, workflow } from '@/data/landing'
import { useSystem } from '@/store/SystemContext'
import { usePlatform } from '@/store/PlatformContext'
import { cn } from '@/lib/cn'

/**
 * The public landing page.
 *
 * Rebuilt from twelve sections to eight. The previous version argued the same
 * point twice — a "problem" band and a "why not a plain booking form" band —
 * and carried a "project targets" strip that read like a proposal slide rather
 * than something a guest or restaurant owner would read. Those claims all
 * survive: the targets became the hero's proof line, and the two argument
 * sections merged into one, so the page is roughly a third shorter without
 * dropping a single claim.
 */
export function LandingPage() {
  const { system } = useSystem()
  const { landing, isFeatureOn } = usePlatform()

  useEffect(() => {
    document.title =
      'SmartDine Optimizer — Restaurant Reservation & Predictive Operations Management'
    setMeta(
      'description',
      'SmartDine Optimizer is a plug-and-play restaurant reservation and ML-based predictive operations management system: live table availability, booking control, footfall and revenue forecasting, food and staff planning, all on a real-time dashboard.',
    )
    setMeta('og:title', `SmartDine Optimizer — ${landing.heroTitleTop} ${landing.heroTitleAccent}`, true)
    setMeta(
      'og:description',
      'Online table booking with live availability, plus machine-learning forecasts for footfall, revenue, food demand and staffing.',
      true,
    )
    setMeta('og:type', 'website', true)
  }, [landing.heroTitleTop, landing.heroTitleAccent])

  const bookingOpen = system.publicBookingEnabled && !system.maintenanceMode

  return (
    <div className="min-h-full bg-page">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {landing.announcementEnabled && landing.announcementText.trim() && (
        <div className="brand-fill px-5 py-2.5 text-center">
          <p className="text-[12.5px] font-semibold text-white">{landing.announcementText}</p>
        </div>
      )}

      <LandingHeader />

      <main id="main">
        <Hero bookingOpen={bookingOpen} content={landing} />
        <ConsolePreview />
        <WhyItExists />
        <ModuleGrid />
        <PredictionBand />
        <GuestFlow bookingOpen={bookingOpen} />
        {isFeatureOn('Restaurant showcase') && (
          <RestaurantShowcase
            eyebrow={landing.showcaseEyebrow}
            title={landing.showcaseTitle}
            lead={landing.showcaseLead}
          />
        )}
        <ClosingSection bookingOpen={bookingOpen} content={landing} />
      </main>

      <LandingFooter />
    </div>
  )
}

function setMeta(name: string, content: string, property = false) {
  const key = property ? 'property' : 'name'
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(key, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/* ------------------------------------------------------------- 2. preview */

/**
 * The console, lifted into the hero's shadow.
 *
 * Negative top margin pulls it over the dark hero so the two read as one
 * composition rather than as a band followed by another band.
 */
function ConsolePreview() {
  return (
    <section id="product" className="relative -mt-16 px-5 pb-16 lg:-mt-24 lg:pb-20">
      <div className="mx-auto max-w-[1180px]">
        <Reveal variant="scale">
          <div className="relative">
            {/* Glow beneath the frame, tying it to the hero above. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-8 -bottom-6 -z-10 h-24 rounded-[40px] bg-brand-700/20 blur-3xl"
            />
            <DashboardPreview />
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-5 text-center text-[11.5px] text-ink-faint">
            A preview of the operations dashboard. Figures shown are sample data.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------- 3. why it exists */

/**
 * The problem and the capability gap, together.
 *
 * These were two separate full-height sections making the same argument. Side
 * by side they argue it once and better: what goes wrong on the left, what a
 * typical restaurant site does about it on the right.
 */
function WhyItExists() {
  return (
    <Section tone="cream">
      <SectionHeading
        eyebrow="Why it exists"
        title="Manual reservations cost more than they look"
        lead="Restaurants serving family dinners, birthdays and business dinners still take bookings by phone, WhatsApp and paper. The cost shows up as double bookings, idle tables and food thrown away."
        align="center"
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <ul className="grid gap-3.5 sm:grid-cols-2">
          {problems.map((p, i) => (
            <Reveal key={p.title} delay={i * 80} as="li">
              <GlowCard className="h-full">
                <span className="text-[11px] font-bold tabular-nums text-brand-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-[15px] font-bold leading-snug text-ink">{p.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{p.detail}</p>
              </GlowCard>
            </Reveal>
          ))}
        </ul>

        {/* What a typical restaurant site covers, and what it does not. */}
        <Reveal delay={180} variant="right">
          <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
            <div className="border-b border-line px-5 py-4">
              <Eyebrow>The gap</Eyebrow>
              <p className="mt-2 text-[13.5px] font-bold text-ink">
                A booking form collects details. It does not run the service.
              </p>
            </div>

            <ul className="divide-y divide-line-soft">
              {comparison.map((row) => (
                <li key={row.capability} className="flex items-center gap-3 px-5 py-2.5">
                  <span
                    className={cn(
                      'flex size-[18px] shrink-0 items-center justify-center rounded-full',
                      row.typical ? 'bg-state-successBg' : 'bg-line-soft',
                    )}
                  >
                    {row.typical ? (
                      <Check className="size-[11px] text-state-success" strokeWidth={3} />
                    ) : (
                      <Minus className="size-[11px] text-ink-faint" strokeWidth={3} />
                    )}
                  </span>
                  <span className="flex-1 text-[12.5px] leading-snug text-ink-soft">
                    {row.capability}
                  </span>
                  <Check className="size-[14px] shrink-0 text-brand-700" strokeWidth={3} />
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-line bg-page px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Typical site
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-700">
                SmartDine
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* --------------------------------------------------------- 4. module grid */

type IconComponent = ComponentType<{ strokeWidth?: string | number; className?: string }>

const moduleIcons: Record<string, IconComponent> = {
  calendar: CalendarDays,
  listChecks: ListChecks,
  table: TableIcon,
  tag: Tag,
  brain: Brain,
  chart: BarChart3,
  database: Database,
  users: Users,
}

function ModuleGrid() {
  return (
    <Section id="modules">
      <SectionHeading
        eyebrow="What's inside"
        title="Eight modules, one connected system"
        lead="Every part writes to the same database, so a booking taken at the front desk changes the floor plan, the forecast and tonight's staffing plan at the same moment."
        align="center"
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m, i) => {
          const Icon = moduleIcons[m.icon] ?? LayoutGrid
          return (
            <Reveal key={m.id} delay={(i % 4) * 70} as="li">
              <GlowCard className="h-full">
                <IconTile>
                  <Icon strokeWidth={2} />
                </IconTile>
                <h3 className="mt-3.5 text-[14.5px] font-bold leading-snug text-ink">{m.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{m.detail}</p>
                {/* Rule that draws itself in on hover. */}
                <span
                  aria-hidden="true"
                  className="mt-4 block h-[2px] w-0 rounded-full bg-gradient-to-r from-brand-700 to-gold-400 motion-safe:transition-all motion-safe:duration-500 group-hover:w-12"
                />
              </GlowCard>
            </Reveal>
          )
        })}
      </ul>
    </Section>
  )
}

/* ---------------------------------------------------- 5. prediction band */

const forecasts: { title: string; detail: string; icon: IconComponent }[] = [
  { title: 'Customer footfall', detail: 'Expected guests per day, date and time slot.', icon: Users },
  { title: 'Revenue', detail: 'Projected takings from reservations and sales history.', icon: TrendingUp },
  { title: 'Food demand', detail: 'What to prepare, with wastage and shortage risk.', icon: UtensilsCrossed },
  { title: 'Employee requirement', detail: 'Chefs, serving and cleaning staff per shift.', icon: ChefHat },
  { title: 'Peak hours', detail: 'The slots that will fill, before they fill.', icon: Clock },
  { title: 'Sales forecast', detail: 'Daily and weekly outlook for planning ahead.', icon: BarChart3 },
]

function PredictionBand() {
  return (
    <Section tone="dark" id="analytics">
      {/* Same aurora language as the hero, quieter. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] top-[-20%] -z-0 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(122,17,19,.42),transparent_66%)] blur-[80px] motion-safe:animate-aurora"
      />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
        <div>
          <SectionHeading
            eyebrow="Predictive operations"
            tone="dark"
            title="Six forecasts that turn bookings into a plan"
            lead="Models learn from reservation, sales, food-usage and staffing history to surface what tonight and next week will look like — while there is still time to act."
          />

          <Reveal delay={160}>
            <div className="mt-7 rounded-[14px] border border-gold-400/25 bg-gold-400/[0.06] p-4">
              <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-gold-200/90">
                <Sparkles className="mt-0.5 size-[15px] shrink-0 text-gold-400" strokeWidth={2} />
                <span>
                  Forecasts are decision support. The restaurant keeps every final call on
                  reservations, food preparation and staffing.
                </span>
              </p>
            </div>
          </Reveal>
        </div>

        <ul className="grid gap-3.5 sm:grid-cols-2">
          {forecasts.map((f, i) => (
            <Reveal key={f.title} delay={i * 70} as="li">
              <GlowCard tone="dark" className="h-full">
                <div className="flex items-start gap-3">
                  <IconTile tone="dark" className="size-[34px] [&>svg]:size-[16px]">
                    <f.icon strokeWidth={2} />
                  </IconTile>
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] font-bold text-white">{f.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/55">{f.detail}</p>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------- 6. the guest flow */

function GuestFlow({ bookingOpen }: { bookingOpen: boolean }) {
  return (
    <Section tone="cream">
      <SectionHeading
        eyebrow="How it works"
        title="From set-up to a planned service"
        lead="Plug-and-play: configure the restaurant once, then run reservations and operations from the same console."
        align="center"
      />

      <ol className="mt-12 grid gap-4 lg:grid-cols-4">
        {workflow.map((step, i) => (
          <Reveal key={step.step} delay={i * 90} as="li">
            <GlowCard className="h-full">
              <div className="flex items-center gap-3">
                <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[12px] font-extrabold text-white">
                  {step.step}
                </span>
                {/* Connector, hidden on the last card and on narrow screens. */}
                {i < workflow.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent lg:block"
                  />
                )}
              </div>
              <h3 className="mt-3.5 text-[14.5px] font-bold leading-snug text-ink">{step.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{step.detail}</p>
              <Link
                to={step.to}
                className="mt-3.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-700 transition hover:gap-2.5 hover:text-brand-bright"
              >
                {step.linkLabel}
                <ArrowRight className="size-[13px]" />
              </Link>
            </GlowCard>
          </Reveal>
        ))}
      </ol>

      {/* What the guest actually gets, ending on the booking CTA. */}
      <Reveal delay={200}>
        <div className="mt-10 overflow-hidden rounded-[18px] border border-line bg-white shadow-card">
          <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:p-8">
            <div>
              <Eyebrow>For your guests</Eyebrow>
              <h3 className="mt-3 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[26px]">
                Pick a table, not a time and a hope
              </h3>
              <p className="mt-3 max-w-[520px] text-[13.5px] leading-relaxed text-ink-muted">
                Guests see the real floor plan, choose where they want to sit, and get a booking
                reference they can track — pending, confirmed, updated or cancelled — without
                calling anyone.
              </p>

              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  { icon: LayoutGrid, text: 'Live floor plan, real tables' },
                  { icon: CalendarDays, text: 'Date, slot, party size, occasion' },
                  { icon: UtensilsCrossed, text: 'Special requests reach the kitchen' },
                  { icon: Bell, text: 'Confirmation and reminder messages' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-[12.5px] text-ink-soft">
                    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <Icon className="size-[13px]" strokeWidth={2.2} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2.5">
              {bookingOpen ? (
                <Link
                  to="/reserve"
                  className="group inline-flex h-[44px] items-center justify-center gap-2 rounded-full bg-brand-bright px-6 text-[13px] font-bold text-white shadow-[0_6px_20px_rgba(192,22,26,.3)] transition hover:bg-brand-600"
                >
                  Reserve a table
                  <ArrowRight className="size-[15px] transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <span className="inline-flex h-[44px] items-center justify-center rounded-full border border-line px-6 text-[13px] font-semibold text-ink-muted">
                  Online booking is closed
                </span>
              )}
              <Link
                to="/track"
                className="inline-flex h-[44px] items-center justify-center rounded-full border border-line px-6 text-[13px] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-700"
              >
                Track a booking
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

/* ------------------------------------------------- 8. FAQ + closing action */

/**
 * The FAQ and the final call to action share a section.
 *
 * They were two bands; a visitor who has read this far wants the answer and
 * the button in the same place, not one after the other.
 */
function ClosingSection({
  bookingOpen,
  content,
}: {
  bookingOpen: boolean
  content: { finalCtaTitle: string; finalCtaBody: string; primaryCtaLabel: string }
}) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <div>
          <SectionHeading eyebrow="FAQ" title="Questions worth asking" />

          <ul className="mt-8 divide-y divide-line">
            {faqs.map((f, i) => {
              const isOpen = open === i
              return (
                <li key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="focus-ring flex w-full items-start gap-3 py-4 text-left"
                  >
                    <span className="flex-1 text-[13.5px] font-bold leading-snug text-ink">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        'mt-0.5 size-[16px] shrink-0 text-brand-700 transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {/* Grid-rows trick: animates height without measuring it. */}
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out',
                      isOpen ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pr-8 text-[12.5px] leading-relaxed text-ink-muted">{f.a}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <Reveal variant="right" delay={120}>
          <div className="sticky top-24 overflow-hidden rounded-[18px] border border-white/10 bg-[#0C0C0E] p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-[radial-gradient(circle,rgba(192,22,26,.5),transparent_66%)] blur-2xl motion-safe:animate-aurora"
            />

            <div className="relative">
              <Eyebrow tone="dark">Get started</Eyebrow>
              <h3 className="mt-3 text-balance text-[23px] font-extrabold leading-tight tracking-[-0.02em] text-white">
                {content.finalCtaTitle}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-white/60">{content.finalCtaBody}</p>

              <div className="mt-6 grid gap-2.5">
                {bookingOpen && (
                  <Link
                    to="/reserve"
                    className="group inline-flex h-[44px] items-center justify-center gap-2 rounded-full bg-brand-bright px-6 text-[13px] font-bold text-white transition hover:bg-brand-600"
                  >
                    {content.primaryCtaLabel}
                    <ArrowRight className="size-[15px] transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                <Link
                  to="/login"
                  className="inline-flex h-[44px] items-center justify-center rounded-full border border-white/18 px-6 text-[13px] font-semibold text-white/85 transition hover:border-gold-400/50 hover:bg-white/5"
                >
                  Sign in to the console
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

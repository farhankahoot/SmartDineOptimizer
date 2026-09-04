import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  Database,
  Gauge,
  ListChecks,
  Minus,
  Radio,
  Shield,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { TableIcon } from '@/components/icons/TableIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/States'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { FloorPlan, PrivateRoom, Wall } from '@/components/floorplan/FloorPlan'
import { publicFloorTables } from '@/data/tables'
import {
  comparison,
  faqs,
  modules,
  objectives,
  problems,
  techStack,
  workflow,
} from '@/data/landing'
import { useSystem } from '@/store/SystemContext'
import type { LandingContent } from '@/data/platform'
import { usePlatform } from '@/store/PlatformContext'
import { RestaurantShowcase } from '@/components/landing/RestaurantShowcase'

/** The chart-backed preview loads after first paint so the hero stays fast. */
const DashboardPreview = lazy(() =>
  import('@/components/landing/ProductPreview').then((m) => ({ default: m.DashboardPreview })),
)

const moduleIcons = {
  calendar: CalendarDays,
  listChecks: ListChecks,
  table: TableIcon,
  tag: Tag,
  brain: Brain,
  gauge: Gauge,
  database: Database,
  shield: Shield,
}

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
        <ProductShowcase />
        <ProblemSection />
        <ObjectivesStrip />
        <FeatureGrid />
        <HowItWorks />
        {isFeatureOn('Restaurant showcase') && (
          <RestaurantShowcase
            eyebrow={landing.showcaseEyebrow}
            title={landing.showcaseTitle}
            lead={landing.showcaseLead}
          />
        )}
        <AnalyticsSection />
        <GuestExperience />
        <ComparisonSection />
        <FaqSection />
        <FinalCta bookingOpen={bookingOpen} content={landing} />
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

/* -------------------------------------------------------------------- hero */

function Hero({ bookingOpen, content }: { bookingOpen: boolean; content: LandingContent }) {
  return (
    <section className="relative overflow-hidden bg-[#0C0C0E]">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(70% 60% at 18% 0%, rgba(122,17,19,.55) 0%, transparent 62%), radial-gradient(55% 55% at 88% 20%, rgba(212,165,55,.18) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative mx-auto max-w-[1240px] px-5 pb-16 pt-14 sm:pt-20 lg:pb-24">
        <div className="mx-auto max-w-[860px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/40 bg-white/[0.04] px-3.5 py-1.5 text-[11.5px] font-semibold text-gold-300">
            <Sparkles className="size-[13px]" />
            {content.heroBadge}
          </span>

          <h1 className="mt-5 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[48px] lg:text-[58px]">
            {content.heroTitleTop}
            <br />
            <span className="text-gold-300">{content.heroTitleAccent}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-relaxed text-white/75 sm:text-[16.5px]">
            {content.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={bookingOpen ? '/reserve' : '/track'} className="w-full sm:w-auto">
              <Button size="lg" block rightIcon={<ArrowRight className="size-[17px]" />}>
                {bookingOpen ? content.primaryCtaLabel : 'Track a booking'}
              </Button>
            </Link>
            <a href="#product" className="w-full sm:w-auto">
              <Button
                size="lg"
                block
                variant="outlineNeutral"
                className="border-white/25 bg-white/[0.04] text-white hover:bg-white/10"
              >
                {content.secondaryCtaLabel}
              </Button>
            </a>
          </div>

          <ul className="mx-auto mt-8 flex max-w-[640px] flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {[
              { icon: Zap, label: 'Book in 1–2 minutes' },
              { icon: Radio, label: 'Live table availability' },
              { icon: BellRing, label: 'Automatic confirmations' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[12.5px] text-white/70">
                <Icon className="size-[14px] text-gold-400" strokeWidth={2.2} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- product preview */

function ProductShowcase() {
  return (
    <section id="product" className="relative -mt-10 pb-16 lg:-mt-16 lg:pb-24">
      <div className="mx-auto max-w-[1180px] px-5">
        <Suspense
          fallback={
            <div className="overflow-hidden rounded-[14px] border border-line bg-white p-4 shadow-panel">
              <Skeleton className="h-[380px] w-full" />
            </div>
          }
        >
          <DashboardPreview />
        </Suspense>

        <p className="mx-auto mt-5 max-w-[620px] text-center text-[13px] text-ink-muted">
          The live operations dashboard — KPI cards, footfall and revenue trends, peak-hour
          utilisation and operational alerts, updated as bookings arrive.
        </p>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- problem */

function ProblemSection() {
  return (
    <Section
      eyebrow="The problem"
      title="Manual reservations cost more than they look"
      lead="Restaurants serving family dinners, birthdays and business dinners still take bookings by phone, WhatsApp and walk-in. The details get captured — the operations do not."
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        {problems.map((p, i) => (
          <Card key={p.title} className="p-5">
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-50 text-[12px] font-bold text-brand-700">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-3.5 text-[15px] font-bold text-ink">{p.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{p.detail}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------- objectives */

function ObjectivesStrip() {
  return (
    <section className="border-y border-line bg-white py-12">
      <div className="mx-auto max-w-[1240px] px-5">
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.08em] text-brand-700">
          Project targets
        </p>
        <h2 className="mx-auto mt-2 max-w-[560px] text-center text-[22px] font-extrabold tracking-[-0.02em] text-ink sm:text-[26px]">
          The outcomes the system is being built and measured against
        </h2>

        <dl className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {objectives.map((o) => (
            <div key={o.label} className="rounded-card border border-line bg-page px-4 py-5">
              <dt className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-brand-700">
                {o.metric}
              </dt>
              <dd className="mt-2 text-[13px] font-semibold text-ink">{o.label}</dd>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">{o.note}</p>
            </div>
          ))}
        </dl>

        <p className="mx-auto mt-6 max-w-[640px] text-center text-[11.5px] text-ink-faint">
          These are the project&apos;s stated objectives and pilot-testing targets, not measured
          results from live restaurants.
        </p>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- features */

function FeatureGrid() {
  return (
    <Section
      id="features"
      eyebrow="What's inside"
      title="Eight modules, one connected system"
      lead="Every part of the platform writes to the same database, so a booking taken at the front desk immediately changes table availability, the dashboard and tomorrow's forecast."
    >
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => {
          const Icon = moduleIcons[m.icon]
          return (
            <Card
              key={m.id}
              className="group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-panel motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                <Icon className="size-[19px]" strokeWidth={1.9} />
              </span>
              <h3 className="mt-4 text-[14.5px] font-bold text-ink">{m.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{m.detail}</p>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------ how it works */

function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From set-up to a planned service"
      lead="The system is plug-and-play: configure the restaurant once, then run reservations and operations from the same console."
      tone="white"
    >
      <ol className="grid gap-3.5 lg:grid-cols-4">
        {workflow.map((w) => (
          <li key={w.step} className="relative">
            <Card className="h-full p-5">
              <span className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-gold-400">
                {w.step}
              </span>
              <h3 className="mt-3 text-[14.5px] font-bold text-ink">{w.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{w.detail}</p>
              <Link
                to={w.to}
                className="focus-ring mt-3.5 inline-flex items-center gap-1.5 rounded text-[12px] font-bold text-brand-700 transition hover:gap-2.5"
              >
                {w.linkLabel}
                <ArrowRight className="size-[13px]" />
              </Link>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/* --------------------------------------------------------------- analytics */

const predictions = [
  { icon: Users, title: 'Footfall prediction', detail: 'Expected guests for a chosen day, date and time slot.' },
  { icon: TrendingUp, title: 'Revenue prediction', detail: 'Forecast revenue from reservations, party size, occasion and deal selection.' },
  { icon: UtensilsCrossed, title: 'Food demand & risk', detail: 'Predicted demand per item, with wastage and shortage risk flagged early.' },
  { icon: Users, title: 'Employee requirement', detail: 'Chefs, serving and cleaning staff needed per shift against expected flow.' },
  { icon: CalendarDays, title: 'Peak-hour detection', detail: 'The slots that will fill first, for table, food and staff planning.' },
  { icon: Gauge, title: 'Sales forecasting', detail: 'Forward sales trends for business planning and reporting.' },
]

function AnalyticsSection() {
  return (
    <section id="analytics" className="relative overflow-hidden bg-[#0C0C0E] py-16 lg:py-24">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(60% 55% at 85% 10%, rgba(122,17,19,.5) 0%, transparent 62%), radial-gradient(45% 45% at 10% 90%, rgba(212,165,55,.14) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-[1240px] px-5">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-gold-400">
            Predictive operations
          </p>
          <h2 className="mt-2.5 text-[26px] font-extrabold tracking-[-0.025em] text-white sm:text-[34px]">
            Six forecasts that turn bookings into a plan
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-white/70">
            Models trained on reservation, sales, food-usage and staffing history surface what
            tonight will look like — and the dashboard turns each one into an alert or a
            recommendation you can act on.
          </p>
        </div>

        <ul className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {predictions.map(({ icon: Icon, title, detail }) => (
            <li
              key={title}
              className="rounded-card border border-white/10 bg-white/[0.04] p-5 transition hover:border-gold-600/40 hover:bg-white/[0.07]"
            >
              <span className="flex size-9 items-center justify-center rounded-[9px] border border-gold-600/40 text-gold-400">
                <Icon className="size-[17px]" strokeWidth={1.9} />
              </span>
              <h3 className="mt-3.5 text-[14px] font-bold text-white">{title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">{detail}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-card border border-white/10 bg-white/[0.03] px-5 py-5 text-center">
          <p className="text-[12.5px] text-white/70">
            <span className="font-bold text-white">Decision support, not autopilot.</span> Forecasts
            are suggestions — the restaurant keeps every final call on reservations, food
            preparation, staffing and planning.
          </p>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {techStack.map((t) => (
            <li
              key={t}
              className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-medium text-white/55"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- guest experience */

function GuestExperience() {
  return (
    <Section
      eyebrow="For your guests"
      title="Pick a table, not a time and a hope"
      lead="Guests see the real floor plan, choose where they want to sit, and get a booking reference they can check at any time — no account required."
      tone="white"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <ul className="grid gap-4">
            {[
              {
                icon: TableIcon,
                title: 'Live table layout',
                detail:
                  'Available, reserved, selected and unavailable tables are colour-coded on the actual restaurant plan.',
              },
              {
                icon: ListChecks,
                title: 'Everything captured up front',
                detail:
                  'Date, time slot, party size, occasion type, seating preference and special requests — collected in one form.',
              },
              {
                icon: BellRing,
                title: 'Confirmation and reminders',
                detail:
                  'Email, SMS or WhatsApp messages go out when a booking is approved, updated or cancelled.',
              },
              {
                icon: Shield,
                title: 'Status you can check yourself',
                detail:
                  'A booking reference shows whether the request is pending, confirmed, updated, rejected or cancelled.',
              },
            ].map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-brand-50 text-brand-700">
                  <Icon className="size-[17px]" strokeWidth={1.9} />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link to="/reserve">
              <Button rightIcon={<ArrowRight className="size-[15px]" />}>Try the booking page</Button>
            </Link>
            <Link to="/track">
              <Button variant="outline">Track a booking</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-white p-4 shadow-panel">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-extrabold text-ink">Select Your Preferred Table</p>
            <span className="flex items-center gap-1.5 text-[10.5px] text-ink-muted">
              <span className="size-[6px] rounded-full bg-state-success" />
              Live availability
            </span>
          </div>

          <ul className="mb-3 flex flex-wrap gap-1.5">
            {[
              ['Available', '#4CAF50'],
              ['Reserved', '#D64545'],
              ['Selected', '#D9A441'],
              ['Unavailable', '#B4B2AE'],
            ].map(([label, color]) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-[7px] border border-line px-2 py-1"
              >
                <span className="size-[9px] rounded-[3px]" style={{ background: color }} />
                <span className="text-[10.5px] font-medium text-ink-soft">{label}</span>
              </li>
            ))}
          </ul>

          <FloorPlan variant="guest" tables={publicFloorTables} aspect="58%">
            <Wall style={{ left: '0%', top: '6%', width: '41%', height: '1.6%' }} />
            <Wall style={{ left: '52.5%', top: '6%', width: '47.5%', height: '1.6%' }} />
            <Wall style={{ left: '58.5%', top: '30%', width: '0.9%', height: '46%' }} />
            <PrivateRoom style={{ left: '60%', top: '66%', width: '39%', height: '34%' }} />
          </FloorPlan>

          <div className="mt-3 flex items-center gap-2.5 rounded-[9px] border border-line bg-[#FDFBF7] px-3 py-2.5">
            <Badge tone="selected">Selected</Badge>
            <span className="text-[12.5px] font-bold text-ink">Table T12</span>
            <span className="text-[11.5px] text-ink-muted">4 Seater · Indoor · Near Window</span>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------- comparison */

function ComparisonSection() {
  return (
    <Section
      eyebrow="Why not a plain booking form"
      title="What a typical restaurant website leaves out"
      lead="Local restaurant sites collect booking details. SmartDine Optimizer manages the reservation and everything the reservation affects."
    >
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">
              Capability comparison between a typical restaurant booking form and SmartDine
              Optimizer
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3.5 text-[12px] font-bold text-ink">
                  Capability
                </th>
                <th scope="col" className="px-4 py-3.5 text-center text-[12px] font-bold text-ink-muted">
                  Typical booking form
                </th>
                <th scope="col" className="px-4 py-3.5 text-center text-[12px] font-bold text-brand-700">
                  SmartDine Optimizer
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.capability} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 text-[12.5px] text-ink-soft">{row.capability}</td>
                  <td className="px-4 py-3 text-center">
                    {row.typical ? (
                      <Check className="mx-auto size-[16px] text-state-success" aria-label="Yes" />
                    ) : (
                      <Minus className="mx-auto size-[16px] text-ink-faint" aria-label="No" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="mx-auto size-[16px] text-state-success" aria-label="Yes" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  )
}

/* --------------------------------------------------------------------- faq */

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section id="faq" eyebrow="FAQ" title="Questions worth asking" tone="white">
      <div className="mx-auto max-w-[760px]">
        <ul className="grid gap-2.5">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <li key={f.q}>
                <Card className={cn('overflow-hidden transition', isOpen && 'shadow-panel')}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="focus-ring flex w-full items-center gap-3 px-4 py-4 text-left"
                    >
                      <span className="flex-1 text-[13.5px] font-bold text-ink">{f.q}</span>
                      <ChevronDown
                        className={cn(
                          'size-[17px] shrink-0 text-brand-700 transition-transform duration-200 motion-reduce:transition-none',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={`faq-panel-${i}`} className="animate-fade-in px-4 pb-4">
                      <p className="text-[12.5px] leading-relaxed text-ink-muted">{f.a}</p>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

/* --------------------------------------------------------------- final CTA */

function FinalCta({ bookingOpen, content }: { bookingOpen: boolean; content: LandingContent }) {
  return (
    <section className="bg-page px-5 pb-16 lg:pb-24">
      <div className="mx-auto max-w-[1080px]">
        <div className="relative overflow-hidden rounded-panel bg-[#0C0C0E] px-6 py-12 text-center sm:px-12 lg:py-16">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(60% 70% at 20% 10%, rgba(122,17,19,.6) 0%, transparent 60%), radial-gradient(50% 60% at 85% 90%, rgba(212,165,55,.16) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-[620px] text-[26px] font-extrabold leading-tight tracking-[-0.025em] text-white sm:text-[34px]">
              {content.finalCtaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[14.5px] leading-relaxed text-white/70">
              {content.finalCtaBody}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {bookingOpen && (
                <Link to="/reserve" className="w-full sm:w-auto">
                  <Button size="lg" block rightIcon={<ArrowRight className="size-[17px]" />}>
                    {content.primaryCtaLabel}
                  </Button>
                </Link>
              )}
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  block
                  variant="outlineNeutral"
                  className="border-white/25 bg-white/[0.04] text-white hover:bg-white/10"
                >
                  Staff log in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ section shell */

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = 'page',
}: {
  id?: string
  eyebrow: string
  title: string
  lead?: string
  children: ReactNode
  tone?: 'page' | 'white'
}) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-20 py-16 lg:py-24', tone === 'white' ? 'bg-white' : 'bg-page')}
    >
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand-700">
            {eyebrow}
          </p>
          <h2 className="mt-2.5 text-[26px] font-extrabold tracking-[-0.025em] text-ink sm:text-[34px]">
            {title}
          </h2>
          {lead && (
            <p className="mt-4 text-[14.5px] leading-relaxed text-ink-muted">{lead}</p>
          )}
        </div>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}

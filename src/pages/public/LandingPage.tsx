import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  Cake,
  ChevronDown,
  Gift,
  Heart,
  LayoutGrid,
  MessageSquare,
  Search,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
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
import { useSystem } from '@/store/SystemContext'
import { usePlatform } from '@/store/PlatformContext'
import { useApi } from '@/lib/useApi'
import { cn } from '@/lib/cn'

type IconComponent = ComponentType<{ strokeWidth?: string | number; className?: string }>

/**
 * Everything the page needs, in one public request.
 *
 * Deals and opening hours are read from the database rather than written into
 * the page, so what a guest sees is what the restaurant has actually
 * configured — change a price in the console and this changes with it.
 */
interface PublicConfig {
  profile: {
    name: string
    tagline: string
    cuisine: string
    phone: string
    email: string
    address: string
    city: string
  }
  hours: { day: string; open: string; close: string; closed: boolean }[]
  rules: { maxPartySize: number; advanceDays: number; requireApproval: boolean }
  deals: { id: string; name: string; category: string; occasion: string; price: number; items: string }[]
}

/**
 * The public site.
 *
 * Rewritten for the person it is actually served to. Deployed, this is the
 * restaurant's own website — a diner arriving here wants a table, not a tour
 * of the software. The previous version led with an admin dashboard
 * screenshot, an eight-module breakdown and a forecasting section, all of
 * which address an owner evaluating a product. Those now live behind the
 * console, with one short band at the end for anyone who is here about the
 * system rather than the food.
 */
export function LandingPage() {
  const { system } = useSystem()
  const { landing, isFeatureOn } = usePlatform()
  const { data: config } = useApi<PublicConfig>('/public/config')

  useEffect(() => {
    const name = config?.profile.name ?? 'Asian Wok'
    document.title = `${name} — Reserve a table online`
    setMeta(
      'description',
      `Book a table at ${name} in about a minute. Choose your date, time and table from the live floor plan, add a special request, and track your booking with a reference — no phone calls.`,
    )
    setMeta('og:title', `${name} — Reserve a table online`, true)
    setMeta(
      'og:description',
      'Pick your table from the live floor plan, book in about a minute, and track your reservation any time.',
      true,
    )
    setMeta('og:type', 'website', true)
  }, [config?.profile.name])

  const bookingOpen = system.publicBookingEnabled && !system.maintenanceMode

  // Today's row from the configured week, for the hero's opening line.
  const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
  const openToday = config?.hours.find((h) => h.day === todayName)

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
        <Hero bookingOpen={bookingOpen} profile={config?.profile} openToday={openToday} />
        <WhyBookHere />
        <HowToBook bookingOpen={bookingOpen} />
        <OccasionsAndDeals deals={config?.deals ?? []} bookingOpen={bookingOpen} />
        {isFeatureOn('Restaurant showcase') && (
          <RestaurantShowcase
            eyebrow={landing.showcaseEyebrow}
            title={landing.showcaseTitle}
            lead={landing.showcaseLead}
          />
        )}
        <GuestQuestions bookingOpen={bookingOpen} hours={config?.hours ?? []} />
        <ForRestaurants />
      </main>

      <LandingFooter profile={config?.profile} hours={config?.hours} />
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

/* -------------------------------------------------------- why book here */

const benefits: { icon: IconComponent; title: string; detail: string }[] = [
  {
    icon: LayoutGrid,
    title: 'See the room before you choose',
    detail:
      'The floor plan shows which tables are actually free for your date and time — window side, the terrace, a quiet corner or a private room. Pick the one you want.',
  },
  {
    icon: Search,
    title: 'Know where your booking stands',
    detail:
      'You get a reference the moment you book. Use it any time to see whether your table is confirmed, updated or cancelled. Nothing to sign up for.',
  },
  {
    icon: BellRing,
    title: 'A reminder before you come',
    detail:
      'We confirm by email once the restaurant approves your table, and send a reminder ahead of your booking so it never slips your mind.',
  },
  {
    icon: MessageSquare,
    title: 'Tell us what the evening is for',
    detail:
      'A birthday cake at nine, a high chair, no spice, a quiet table for a business dinner — your request reaches the kitchen with the booking.',
  },
]

function WhyBookHere() {
  return (
    <Section id="booking" tone="cream">
      <SectionHeading
        eyebrow="Booking with us"
        title="No phone calls. No waiting to hear back."
        lead="Everything you need to reserve a table, and to check it later, without speaking to anyone."
        align="center"
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {benefits.map((b, i) => (
          <Reveal key={b.title} delay={i * 80} as="li">
            <GlowCard className="h-full">
              <div className="flex items-start gap-4">
                <IconTile>
                  <b.icon strokeWidth={2} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold leading-snug text-ink">{b.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{b.detail}</p>
                </div>
              </div>
            </GlowCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}

/* ------------------------------------------------------------ how to book */

const steps = [
  {
    n: '1',
    title: 'Tell us the basics',
    detail: 'Your name, a phone number and an email. That is all we need to hold a table.',
  },
  {
    n: '2',
    title: 'Choose date, time and party',
    detail: 'Pick from the times the restaurant is taking bookings for, and say how many are coming.',
  },
  {
    n: '3',
    title: 'Pick your table',
    detail: 'The floor plan shows what is free. Choose where you would like to sit and add any request.',
  },
  {
    n: '4',
    title: 'Get your reference',
    detail: 'We send it straight away. The restaurant confirms, and you can check the status any time.',
  },
]

function HowToBook({ bookingOpen }: { bookingOpen: boolean }) {
  return (
    <Section id="how">
      <SectionHeading eyebrow="How it works" title="Four steps, about a minute" align="center" />

      <ol className="mt-12 grid gap-4 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 90} as="li">
            <GlowCard className="h-full">
              <div className="flex items-center gap-3">
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[14px] font-extrabold text-white">
                  {s.n}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent lg:block"
                  />
                )}
              </div>
              <h3 className="mt-4 text-[15px] font-bold leading-snug text-ink">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{s.detail}</p>
            </GlowCard>
          </Reveal>
        ))}
      </ol>

      {bookingOpen && (
        <Reveal delay={200}>
          <div className="mt-10 text-center">
            <Link
              to="/reserve"
              className="group inline-flex h-[48px] items-center gap-2 rounded-full bg-brand-bright px-8 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(192,22,26,.3)] transition hover:bg-brand-600"
            >
              Start your booking
              <ArrowRight className="size-[16px] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      )}
    </Section>
  )
}

/* ---------------------------------------------------- occasions and deals */

/** Occasion names come from the deals themselves, so this maps loosely. */
function occasionIcon(occasion: string): IconComponent {
  const key = occasion.toLowerCase()
  if (key.includes('birthday')) return Cake
  if (key.includes('anniversary') || key.includes('date')) return Heart
  if (key.includes('family')) return Users
  if (key.includes('group') || key.includes('celebration')) return Gift
  return UtensilsCrossed
}

function OccasionsAndDeals({
  deals,
  bookingOpen,
}: {
  deals: PublicConfig['deals']
  bookingOpen: boolean
}) {
  const money = (n: number) =>
    `₨${n.toLocaleString('en-PK', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`

  return (
    <Section id="deals" tone="cream">
      <SectionHeading
        eyebrow="Menus & occasions"
        title="Set menus for the evenings that matter"
        lead="Tell us the occasion when you book and the kitchen will have it ready. Prices are per package."
        align="center"
      />

      {deals.length === 0 ? (
        <Reveal>
          <p className="mt-10 text-center text-[13px] text-ink-muted">
            Set menus are being updated. Please call the restaurant for today&apos;s options.
          </p>
        </Reveal>
      ) : (
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d, i) => {
            const Icon = occasionIcon(d.occasion)
            return (
              <Reveal key={d.id} delay={(i % 3) * 80} as="li">
                <GlowCard className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <IconTile>
                      <Icon strokeWidth={2} />
                    </IconTile>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                      {d.occasion}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[16px] font-bold text-ink">{d.name}</h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-muted">{d.items}</p>

                  <div className="mt-4 flex items-baseline gap-1.5 border-t border-line pt-3.5">
                    <span className="text-[22px] font-extrabold leading-none text-ink">
                      {money(d.price)}
                    </span>
                    <span className="text-[11.5px] text-ink-faint">per package</span>
                  </div>
                </GlowCard>
              </Reveal>
            )
          })}
        </ul>
      )}

      {bookingOpen && deals.length > 0 && (
        <Reveal delay={160}>
          <p className="mt-8 text-center text-[13px] text-ink-muted">
            Choose your occasion on the{' '}
            <Link to="/reserve" className="font-bold text-brand-700 underline-offset-2 hover:underline">
              booking form
            </Link>{' '}
            and add anything else in the notes.
          </p>
        </Reveal>
      )}
    </Section>
  )
}

/* -------------------------------------------------------- guest questions */

const guestFaqs = [
  {
    q: 'Do I need an account to book?',
    a: 'No. Enter your name, phone number and email, and you are done. You will get a booking reference you can use to check your reservation later — there is nothing to sign up for and no password to remember.',
  },
  {
    q: 'Is my table confirmed straight away?',
    a: 'Your request reaches the restaurant immediately and the table is held for you while they review it. Once someone confirms it, you get an email. If anything needs to change, they will update the booking and let you know.',
  },
  {
    q: 'How do I check or cancel my booking?',
    a: 'Go to "Check my booking", enter your reference and the email you booked with. You will see whether it is pending, confirmed, updated or cancelled — and you can cancel it there yourself if your plans change.',
  },
  {
    q: 'Can I choose where I sit?',
    a: 'Yes. The floor plan shows which tables are free for your date and time, including window side, the outdoor terrace and private rooms. Pick the one you want and it is held for you.',
  },
  {
    q: 'Can I ask for a cake, a high chair or a quiet table?',
    a: 'Please do. There is a notes box on the booking form, and whatever you write there goes to the kitchen and the floor team along with your reservation.',
  },
  {
    q: 'How far ahead can I book, and for how many people?',
    a: 'That depends on what the restaurant has set — the booking form only offers dates and party sizes it can actually take, so anything you can select is available to book.',
  },
  {
    q: 'Can I pay online?',
    a: 'Not at the moment. Booking a table costs nothing, and you settle the bill at the restaurant as usual.',
  },
]

function GuestQuestions({
  bookingOpen,
  hours,
}: {
  bookingOpen: boolean
  hours: PublicConfig['hours']
}) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <div>
          <SectionHeading eyebrow="Questions" title="Anything you might be wondering" />

          <ul className="mt-8 divide-y divide-line">
            {guestFaqs.map((f, i) => {
              const isOpen = open === i
              return (
                <li key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="focus-ring flex w-full items-start gap-3 py-4 text-left"
                  >
                    <span className="flex-1 text-[14px] font-bold leading-snug text-ink">{f.q}</span>
                    <ChevronDown
                      className={cn(
                        'mt-0.5 size-[16px] shrink-0 text-brand-700 transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out',
                      isOpen ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pr-8 text-[13px] leading-relaxed text-ink-muted">{f.a}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Opening hours and the booking action, side by side. */}
        <Reveal variant="right" delay={120}>
          <div className="sticky top-24 grid gap-4">
            {hours.length > 0 && (
              <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
                <div className="border-b border-line px-5 py-3.5">
                  <Eyebrow>Opening hours</Eyebrow>
                </div>
                <ul className="divide-y divide-line-soft">
                  {hours.map((h) => (
                    <li
                      key={h.day}
                      className="flex items-center justify-between gap-3 px-5 py-2.5 text-[12.5px]"
                    >
                      <span className="text-ink-soft">{h.day}</span>
                      <span className={cn('font-semibold', h.closed ? 'text-ink-faint' : 'text-ink')}>
                        {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="relative overflow-hidden rounded-[16px] border border-white/10 bg-[#0C0C0E] p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(192,22,26,.5),transparent_66%)] blur-2xl motion-safe:animate-aurora"
              />
              <div className="relative">
                <h3 className="text-[19px] font-extrabold leading-tight text-white">
                  Ready when you are
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
                  Pick your table and we will hold it while the restaurant confirms.
                </p>
                <div className="mt-5 grid gap-2.5">
                  {bookingOpen && (
                    <Link
                      to="/reserve"
                      className="group inline-flex h-[44px] items-center justify-center gap-2 rounded-full bg-brand-bright px-6 text-[13px] font-bold text-white transition hover:bg-brand-600"
                    >
                      Reserve a table
                      <ArrowRight className="size-[15px] transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                  <Link
                    to="/track"
                    className="inline-flex h-[44px] items-center justify-center rounded-full border border-white/18 px-6 text-[13px] font-semibold text-white/85 transition hover:border-gold-400/50 hover:bg-white/5"
                  >
                    Check my booking
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------- for restaurants */

/**
 * One short band for the other audience.
 *
 * Restaurant owners and staff do arrive here, and the console needs a way in —
 * but they are the minority of visitors, so this sits at the end rather than
 * setting the tone for the whole page.
 */
function ForRestaurants() {
  return (
    <Section tone="cream">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-6 rounded-[18px] border border-line bg-white p-6 shadow-card lg:flex-row lg:items-center lg:p-8">
          <div className="max-w-[620px]">
            <Eyebrow>For restaurants</Eyebrow>
            <h2 className="mt-3 text-[21px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
              Running the restaurant, not just the bookings
            </h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
              Behind this booking page is SmartDine Optimizer: reservation control, table and time
              slot management, food deals, staff planning, and forecasts for footfall, revenue, food
              demand and staffing on a real-time dashboard.
            </p>
          </div>

          <Link
            to="/login"
            className="group inline-flex h-[44px] shrink-0 items-center gap-2 rounded-full border border-line px-6 text-[13px] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-700"
          >
            <Sparkles className="size-[15px] text-gold-500" strokeWidth={2} />
            Staff sign in
            <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>
    </Section>
  )
}

import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  Cake,
  CalendarRange,
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
import { Hero } from '@/components/landing/Hero'
import { Reveal, CountUp } from '@/components/landing/Reveal'
import { RoomPreview } from '@/components/landing/RoomPreview'
import {
  useBookingPicker,
  type AvailabilityPayload,
  type BookingRules,
  type BookingSlot,
} from '@/components/landing/BookingStarter'
import { Eyebrow, Section, SectionHeading } from '@/components/landing/LandingPrimitives'
import { useSystem } from '@/store/SystemContext'
import { usePlatform } from '@/store/PlatformContext'
import { useApi } from '@/lib/useApi'
import { cn } from '@/lib/cn'

type IconComponent = ComponentType<{ strokeWidth?: string | number; className?: string }>

/**
 * Everything the page needs, in one public request.
 *
 * Deals, opening hours, booking rules and time slots are read from the
 * database rather than written into the page, so what a guest sees is what the
 * restaurant has actually configured — change a price or close a slot in the
 * console and this changes with it.
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
  rules: BookingRules
  timeSlots: BookingSlot[]
  deals: {
    id: string
    name: string
    category: string
    occasion: string
    price: number
    items: string
  }[]
}

/**
 * The public site.
 *
 * Written for the person it is actually served to: deployed, this is the
 * restaurant's own website, and a diner arriving here wants a table — not a
 * tour of the software. The page is built around one live thread rather than a
 * stack of brochure copy: the hero asks when and for how many, the room below
 * redraws to answer it, and the booking page picks the thread up with those
 * answers already filled in.
 */
export function LandingPage() {
  const { system } = useSystem()
  const { landing } = usePlatform()
  const { data: config } = useApi<PublicConfig>('/public/config')

  const bookingOpen = system.publicBookingEnabled && !system.maintenanceMode

  // When, and for how many. Held here rather than inside the hero so the floor
  // plan further down answers the same question the visitor just asked.
  const picker = useBookingPicker(config ?? undefined)
  const availability = useApi<AvailabilityPayload>(
    picker.ready ? '/public/availability' : null,
    { date: picker.date, timeSlot: picker.slot, guests: picker.guests },
  )

  useEffect(() => {
    const name = config?.profile.name ?? 'Asian Wok'
    document.title = `${name} — Reserve a table online`
    setMeta(
      'description',
      `Book a table at ${name} in about a minute. See which tables are free for your date and time on the live floor plan, choose where you sit, and track your booking with a reference — no phone calls.`,
    )
    setMeta('og:title', `${name} — Reserve a table online`, true)
    setMeta(
      'og:description',
      'See which tables are free tonight, pick the one you want, and track your reservation any time.',
      true,
    )
    setMeta('og:type', 'website', true)
  }, [config?.profile.name])

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
        <Hero
          bookingOpen={bookingOpen}
          profile={config?.profile}
          openToday={openToday}
          picker={picker}
          availability={availability.data}
          availabilityLoading={availability.loading}
          titleAccent={landing.heroTitleAccent}
          subtitle={landing.heroSubtitle}
        />

        <FactStrip
          tables={availability.data?.tables.length ?? null}
          slots={picker.slots.length}
          rules={config?.rules}
        />

        <SeeTheRoom
          picker={picker}
          availability={availability.data}
          loading={availability.loading}
          bookingOpen={bookingOpen}
        />

        <HowToBook bookingOpen={bookingOpen} href={picker.href} />

        <MenusAndOccasions deals={config?.deals ?? []} bookingOpen={bookingOpen} href={picker.href} />

        <GuestQuestions
          bookingOpen={bookingOpen}
          hours={config?.hours ?? []}
          href={picker.href}
          ctaTitle={landing.finalCtaTitle}
          ctaBody={landing.finalCtaBody}
        />

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

/* ----------------------------------------------------------- fact strip */

/**
 * The four numbers a guest actually wants before they commit to reading on.
 *
 * Every one is read from the restaurant's configuration, so raising the party
 * limit or opening another slot in the console changes this line. Nothing here
 * is a marketing figure.
 */
function FactStrip({
  tables,
  slots,
  rules,
}: {
  tables: number | null
  slots: number
  rules?: BookingRules
}) {
  const facts = [
    { value: tables, suffix: '', label: 'tables in the room' },
    { value: slots || null, suffix: '', label: 'sittings a day' },
    { value: rules?.maxPartySize ?? null, suffix: '', label: 'guests per booking' },
    { value: rules?.advanceDays ?? null, suffix: ' days', label: 'you can book ahead' },
  ]

  return (
    <section className="border-b border-line bg-white">
      {/*
        The padding lives on the wrapper, not on the grid.
        Putting `px-5` on the same element that carries `bg-line` painted the
        divider colour across the outer padding too, so the strip ended in two
        stray grey bars at the page edges.
      */}
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {facts.map((f, i) => (
            <Reveal key={f.label} delay={i * 90} className="bg-white">
              <div className="group flex h-full flex-col items-center px-4 py-8 text-center">
                <p className="text-[30px] font-extrabold leading-none tracking-[-0.03em] text-brand-700 transition-transform duration-300 group-hover:-translate-y-0.5">
                  {f.value === null ? (
                    <span className="text-ink-faint/40">—</span>
                  ) : (
                    <CountUp to={f.value} suffix={f.suffix} duration={1100} />
                  )}
                </p>

                {/* Gold rule that sweeps out once the strip scrolls into view. */}
                <span
                  aria-hidden="true"
                  className="mt-3 h-[2px] w-10 origin-center scale-x-0 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-transform delay-300 duration-700 ease-out group-data-[shown=true]/reveal:scale-x-100"
                />

                <p className="mt-3 text-[12px] font-medium text-ink-muted">{f.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- see the room */

const reassurances: { icon: IconComponent; title: string; detail: string }[] = [
  {
    icon: Search,
    title: 'A reference, not an account',
    detail: 'Check or cancel any time with the code we send. Nothing to sign up for.',
  },
  {
    icon: BellRing,
    title: 'Confirmed by email',
    detail: 'We write when the table is approved, and remind you before you come.',
  },
  {
    icon: MessageSquare,
    title: 'Requests reach the kitchen',
    detail: 'A cake at nine, a high chair, no spice — it travels with the booking.',
  },
  {
    icon: LayoutGrid,
    title: 'Window, terrace or private',
    detail: 'Every section is on the plan. Sit where you actually want to sit.',
  },
]

function SeeTheRoom({
  picker,
  availability,
  loading,
  bookingOpen,
}: {
  picker: ReturnType<typeof useBookingPicker>
  availability: AvailabilityPayload | null
  loading: boolean
  bookingOpen: boolean
}) {
  return (
    <Section id="booking">
      <SectionHeading
        eyebrow="Booking with us"
        title="See the room before you choose"
        lead="Most booking forms ask you to trust them. This one shows you the floor."
        align="center"
      />

      <Reveal className="mt-12">
        <RoomPreview
          picker={picker}
          availability={availability}
          loading={loading}
          bookingOpen={bookingOpen}
        />
      </Reveal>

      {/*
        Supporting points, deliberately quieter than the plan above them.

        One segmented panel rather than four separate cards — the page already
        has enough card grids — but the cells now carry their own padding. They
        previously had none, so the hairline between columns cut straight into
        the text, which is what made this band look unfinished.
      */}
      <ul className="mt-14 grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {reassurances.map((r, i) => (
          <Reveal key={r.title} delay={i * 80} as="li" className="bg-white">
            <div className="group h-full bg-white p-5 transition-colors duration-300 hover:bg-brand-50/50">
              <span className="flex size-[38px] items-center justify-center rounded-[11px] bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-700 group-hover:text-white group-hover:ring-brand-700">
                <r.icon className="size-[18px]" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[13.5px] font-bold leading-snug text-ink">{r.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{r.detail}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}

/* ------------------------------------------------------------ how to book */

const steps = [
  {
    n: '01',
    title: 'When, and how many',
    detail: 'Already answered at the top of this page. It travels with you.',
  },
  {
    n: '02',
    title: 'Pick your table',
    detail: 'The plan shows what is free. Choose the one you want.',
  },
  {
    n: '03',
    title: 'Your details',
    detail: 'A name, a number, an email — and anything the kitchen should know.',
  },
  {
    n: '04',
    title: 'Keep the reference',
    detail: 'Sent straight away. Use it to check or cancel, any time.',
  },
]

/**
 * A dark band, on purpose.
 *
 * Four pale cards in a row was the third identical grid on the page, and the
 * whole thing read as one long beige slab. Breaking to the brand's own near
 * black here gives the page a spine and makes the sections either side feel
 * deliberate rather than continuous.
 */
function HowToBook({ bookingOpen, href }: { bookingOpen: boolean; href: string }) {
  return (
    <Section id="how" tone="dark">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(122,17,19,.45),transparent_66%)] blur-[80px] motion-safe:animate-aurora"
      />

      <div className="relative">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, about a minute"
          lead="No phone calls, no waiting to hear back, and nothing to remember afterwards."
          tone="dark"
          align="center"
        />

        <ol className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
          {/* The rail the numbers sit on. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-[21px] hidden h-px bg-gradient-to-r from-transparent via-gold-400/35 to-transparent lg:block"
          />

          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} as="li" className="relative lg:text-center">
              <span className="relative z-10 inline-flex size-[44px] items-center justify-center rounded-full border border-gold-400/30 bg-[#0C0C0E] text-[13px] font-extrabold text-gold-300">
                {s.n}
              </span>
              <h3 className="mt-5 text-[15px] font-bold leading-snug text-white">{s.title}</h3>
              {/*
                `mx-auto` is desktop-only. Below `lg` the steps are a stacked
                left-aligned list, and centring just the paragraph pushed it
                away from the heading it belongs to.
              */}
              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-white/55 lg:mx-auto">
                {s.detail}
              </p>
            </Reveal>
          ))}
        </ol>

        {bookingOpen && (
          <Reveal delay={220}>
            <div className="mt-14 text-center">
              <Link
                to={href}
                className="group focus-ring inline-flex h-[50px] items-center gap-2 rounded-full bg-brand-bright px-8 text-[14px] font-bold text-white shadow-[0_8px_28px_rgba(192,22,26,.4)] transition hover:bg-brand-600"
              >
                Start your booking
                <ArrowRight className="size-[16px] transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  )
}

/* ---------------------------------------------------- menus and occasions */

/** Occasion names come from the deals themselves, so this maps loosely. */
function occasionIcon(occasion: string): IconComponent {
  const key = occasion.toLowerCase()
  if (key.includes('birthday')) return Cake
  if (key.includes('anniversary') || key.includes('date')) return Heart
  if (key.includes('family')) return Users
  if (key.includes('group') || key.includes('celebration')) return Gift
  return UtensilsCrossed
}

/**
 * Laid out as a menu rather than as cards.
 *
 * These *are* menu items, and a printed menu is the form the content already
 * has: a name, what is in it, and a price on the right. It also stops this
 * being the third card grid on one page.
 */
function MenusAndOccasions({
  deals,
  bookingOpen,
  href,
}: {
  deals: PublicConfig['deals']
  bookingOpen: boolean
  href: string
}) {
  const money = (n: number) =>
    `₨${n.toLocaleString('en-PK', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`

  return (
    // Cream, so the white menu panel reads as a panel rather than merging into
    // the section behind it. Also keeps the page alternating after the dark band.
    <Section id="deals" tone="cream">
      <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            eyebrow="Menus & occasions"
            title="Set menus for the evenings that matter"
            lead="Tell us the occasion when you book and the kitchen will have it ready. Prices are per package."
          />

          {bookingOpen && deals.length > 0 && (
            <Link
              to={href}
              className="group focus-ring mt-7 inline-flex h-[44px] items-center gap-2 rounded-full border border-line bg-white px-6 text-[13px] font-bold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50"
            >
              Book with an occasion
              <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {deals.length === 0 ? (
          <p className="text-[13px] text-ink-muted">
            Set menus are being updated. Please call the restaurant for today&apos;s options.
          </p>
        ) : (
          /*
           * A menu panel, not a bare list.
           *
           * The rows used to be `bg-page` on a white section with hairlines
           * running the full width and no side padding, which read as a grey
           * slab with lines through it. Contained in one bordered white panel
           * with real padding, the same content reads as a printed menu.
           */
          <ul className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
            {deals.map((d, i) => {
              const Icon = occasionIcon(d.occasion)
              return (
                <Reveal key={d.id} delay={Math.min(i, 5) * 70} as="li">
                  <div className="group flex items-start gap-4 px-5 py-4 transition-colors duration-300 hover:bg-brand-50/40 sm:gap-5">
                    <span className="mt-0.5 flex size-[40px] shrink-0 items-center justify-center rounded-[11px] bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-700 group-hover:text-white group-hover:ring-brand-700">
                      <Icon className="size-[18px]" strokeWidth={2} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <h3 className="text-[15.5px] font-bold leading-snug text-ink">{d.name}</h3>
                        <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-gold-600 ring-1 ring-inset ring-gold-200/60">
                          {d.occasion}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                        {d.items}
                      </p>
                    </div>

                    <div className="shrink-0 pl-3 text-right">
                      <p className="text-[19px] font-extrabold leading-none tracking-[-0.02em] text-ink transition-colors duration-300 group-hover:text-brand-700">
                        {money(d.price)}
                      </p>
                      <p className="mt-1 text-[10.5px] text-ink-faint">per package</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </ul>
        )}
      </div>
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
  href,
  ctaTitle,
  ctaBody,
}: {
  bookingOpen: boolean
  hours: PublicConfig['hours']
  href: string
  /** Editable in the Control Centre — Landing Page › Closing panel. */
  ctaTitle: string
  ctaBody: string
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
                <h3 className="text-[19px] font-extrabold leading-tight text-white">{ctaTitle}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">{ctaBody}</p>
                <div className="mt-5 grid gap-2.5">
                  {bookingOpen && (
                    <Link
                      to={href}
                      className="group focus-ring inline-flex h-[44px] items-center justify-center gap-2 rounded-full bg-brand-bright px-6 text-[13px] font-bold text-white transition hover:bg-brand-600"
                    >
                      Reserve a table
                      <ArrowRight className="size-[15px] transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                  <Link
                    to="/track"
                    className="focus-ring inline-flex h-[44px] items-center justify-center rounded-full border border-white/20 px-6 text-[13px] font-semibold text-white/85 transition hover:border-gold-400/50 hover:bg-white/5"
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

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/feedback"
              className="focus-ring inline-flex h-[44px] items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-ink-muted transition hover:text-brand-700"
            >
              <CalendarRange className="size-[15px]" strokeWidth={2} />
              Leave feedback
            </Link>
            <Link
              to="/login"
              className="group focus-ring inline-flex h-[44px] items-center gap-2 rounded-full border border-line px-6 text-[13px] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-700"
            >
              <Sparkles className="size-[15px] text-gold-500" strokeWidth={2} />
              Staff sign in
              <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

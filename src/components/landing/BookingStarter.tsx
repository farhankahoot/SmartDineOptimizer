import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Lock, Minus, Plus } from 'lucide-react'
import { Select } from '@/components/ui/Field'
import { cn } from '@/lib/cn'

/**
 * The booking starter.
 *
 * The full booking flow is its own page — it needs the floor plan, contact
 * details, the occasion and the notes box, and none of that belongs on a home
 * page. What *does* belong here is the first decision a guest makes: when, and
 * for how many. This widget takes those three answers, tells them honestly
 * whether the restaurant can seat them, and hands the answers to `/reserve`
 * through the query string so nothing is typed twice.
 *
 * It reads the same endpoints the booking page does, so it can never offer a
 * date, a slot or a party size the server would reject.
 */

export interface BookingRules {
  minPartySize: number
  maxPartySize: number
  advanceDays: number
  allowSameDay: boolean
  requireApproval: boolean
}

export interface BookingSlot {
  id: string
  label: string
  start: string
  end: string
  status: string
  mealPeriod?: string
}

/** What `/public/availability` returns for a date, slot and party size. */
export interface AvailabilityPayload {
  availableCount: number
  tables: {
    id: string
    seats: number
    type: string
    section: string
    shape: 'round' | 'rect' | 'square'
    status: 'Available' | 'Reserved' | 'Unavailable'
    x: number
    y: number
    w: number
    h: number
  }[]
}

export interface QuickDate {
  value: string
  /** "Today", "Tomorrow", then the weekday. */
  name: string
  /** "24 Sep" */
  day: string
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** "8:00 PM" → 20. Returns -1 for anything it cannot read, never a guess. */
function hourOf(label: string): number {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(label.trim())
  if (!m) return -1
  const hour = Number(m[1]) % 12
  return m[3].toUpperCase() === 'PM' ? hour + 12 : hour
}

/**
 * The next few bookable days.
 *
 * Generated from the restaurant's own rules rather than hard-coded, so
 * same-day booking being closed removes today instead of offering a date the
 * server will refuse.
 */
function quickDates(rules: BookingRules | undefined): QuickDate[] {
  const allowSameDay = rules?.allowSameDay ?? true
  const advance = Math.max(1, rules?.advanceDays ?? 30)

  const first = allowSameDay ? 0 : 1
  const out: QuickDate[] = []

  for (let i = first; i < first + 4 && i <= advance; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    out.push({
      value: iso(d),
      name:
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    })
  }

  return out
}

export interface BookingPicker {
  date: string
  slot: string
  guests: number
  setDate: (value: string) => void
  setSlot: (value: string) => void
  setGuests: (value: number) => void
  dates: QuickDate[]
  slots: BookingSlot[]
  rules: BookingRules | undefined
  /** True once the picker holds a date and a slot worth querying. */
  ready: boolean
  /** The handoff URL — everything chosen here, carried into the booking page. */
  href: string
}

/**
 * Holds the three answers the home page collects.
 *
 * Lifted out of the widget so the room preview further down the page can show
 * the same date and slot: changing the party size in the hero updates the
 * floor plan below it, which is what makes the page feel like one product
 * rather than a stack of unrelated bands.
 */
export function useBookingPicker(config?: {
  rules: BookingRules
  timeSlots: BookingSlot[]
}): BookingPicker {
  const rules = config?.rules
  const dates = useMemo(() => quickDates(rules), [rules])

  // Slots the restaurant is actually taking bookings for.
  const slots = useMemo(
    () => (config?.timeSlots ?? []).filter((s) => s.status !== 'Closed' && s.status !== 'Blocked'),
    [config?.timeSlots],
  )

  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [guests, setGuests] = useState(2)

  // Seed from the live options the moment they arrive, and re-seed if a choice
  // stops being offered — a tab left open overnight must not keep yesterday.
  useEffect(() => {
    if (dates.length > 0) {
      setDate((current) => (dates.some((d) => d.value === current) ? current : dates[0].value))
    }
  }, [dates])

  useEffect(() => {
    if (slots.length === 0) return
    setSlot((current) => {
      if (slots.some((s) => s.start === current)) return current
      // Open on dinner: it is what most guests are booking, and landing on the
      // lunch sitting makes the availability line answer a question nobody
      // asked. Falls back to the first slot if the restaurant has no evening.
      const evening = slots.find((s) => hourOf(s.start) >= 18)
      return (evening ?? slots[0]).start
    })
  }, [slots])

  useEffect(() => {
    if (!rules) return
    setGuests((n) => Math.min(Math.max(n, rules.minPartySize), rules.maxPartySize))
  }, [rules])

  const href = `/reserve?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}&guests=${guests}`

  return {
    date,
    slot,
    guests,
    setDate,
    setSlot,
    setGuests,
    dates,
    slots,
    rules,
    ready: Boolean(date && slot),
    href,
  }
}

export function BookingStarter({
  picker,
  availability,
  loading,
  bookingOpen,
  className,
}: {
  picker: BookingPicker
  availability: AvailabilityPayload | null
  loading: boolean
  bookingOpen: boolean
  className?: string
}) {
  const { date, slot, guests, dates, slots, rules } = picker

  const min = rules?.minPartySize ?? 1
  const max = rules?.maxPartySize ?? 12

  const free = availability?.availableCount ?? null
  const total = availability?.tables.length ?? null

  if (!bookingOpen) {
    return (
      <div
        className={cn(
          'rounded-[20px] border border-white/10 bg-white/[0.05] p-7 text-center backdrop-blur-md',
          className,
        )}
      >
        <span className="mx-auto flex size-[44px] items-center justify-center rounded-full bg-white/10 text-white/70">
          <Lock className="size-[19px]" strokeWidth={2} />
        </span>
        <h2 className="mt-4 text-[17px] font-extrabold text-white">Online booking is closed</h2>
        <p className="mx-auto mt-2 max-w-[280px] text-[12.5px] leading-relaxed text-white/60">
          We are not taking reservations through the site right now. Please call us and we will find
          you a table.
        </p>
        <Link
          to="/track"
          className="focus-ring mt-5 inline-flex h-[42px] items-center justify-center rounded-full border border-white/20 px-6 text-[13px] font-semibold text-white transition hover:bg-white/5"
        >
          Check an existing booking
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] bg-white shadow-[0_24px_70px_-20px_rgba(0,0,0,.65)] ring-1 ring-black/5',
        className,
      )}
    >
      <div className="border-b border-line px-6 py-5">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full rounded-full bg-state-success motion-safe:animate-ping-soft" />
            <span className="relative inline-flex size-1.5 rounded-full bg-state-success" />
          </span>
          Live availability
        </span>
        <h2 className="mt-2 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          Find your table
        </h2>
      </div>

      <div className="px-6 py-5">
        {/* ------------------------------------------------------------ when */}
        <FieldLabel>When</FieldLabel>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {dates.length === 0
            ? Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-[52px] animate-pulse rounded-[10px] bg-line-soft" />
              ))
            : dates.map((d) => {
                const active = d.value === date
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => picker.setDate(d.value)}
                    aria-pressed={active}
                    className={cn(
                      'focus-ring flex h-[52px] flex-col items-center justify-center rounded-[10px] border text-center transition',
                      active
                        ? 'border-brand-700 bg-brand-700 text-white shadow-navActive'
                        : 'border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50',
                    )}
                  >
                    <span className="text-[11.5px] font-bold leading-none">{d.name}</span>
                    <span
                      className={cn(
                        'mt-1 text-[10.5px] leading-none',
                        active ? 'text-white/70' : 'text-ink-faint',
                      )}
                    >
                      {d.day}
                    </span>
                  </button>
                )
              })}
        </div>

        {/* ------------------------------------------------- time and party */}
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_128px] gap-3">
          <div>
            <FieldLabel htmlFor="starter-time">Time</FieldLabel>
            <div className="mt-2">
              <Select
                id="starter-time"
                aria-label="Time slot"
                value={slot}
                placeholder={slots.length === 0 ? 'Loading…' : 'Choose a time'}
                disabled={slots.length === 0}
                onChange={(e) => picker.setSlot(e.target.value)}
                options={slots.map((s) => ({ value: s.start, label: s.start }))}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Guests</FieldLabel>
            <div className="mt-2 flex h-[38px] items-center justify-between rounded-[8px] border border-line bg-white px-1">
              <Stepper
                label="One fewer guest"
                onClick={() => picker.setGuests(Math.max(min, guests - 1))}
                disabled={guests <= min}
              >
                <Minus className="size-[14px]" strokeWidth={2.5} />
              </Stepper>
              <span className="text-[13px] font-bold tabular-nums text-ink">{guests}</span>
              <Stepper
                label="One more guest"
                onClick={() => picker.setGuests(Math.min(max, guests + 1))}
                disabled={guests >= max}
              >
                <Plus className="size-[14px]" strokeWidth={2.5} />
              </Stepper>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ the live answer */}
        <div
          className={cn(
            'mt-4 flex items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-[12.5px] transition-colors',
            loading || free === null
              ? 'border-line bg-line-soft/60 text-ink-muted'
              : free === 0
                ? 'border-state-danger/25 bg-state-dangerBg text-state-danger'
                : 'border-state-success/25 bg-state-successBg text-state-successSolid',
          )}
          aria-live="polite"
        >
          {loading || free === null ? (
            <>
              <Loader2 className="size-[14px] shrink-0 animate-spin" />
              <span className="font-medium">Checking what is free…</span>
            </>
          ) : free === 0 ? (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-state-danger" />
              <span className="font-semibold">
                Fully booked at {slot} — try another time or day.
              </span>
            </>
          ) : (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-state-success" />
              <span className="font-semibold">
                {free} of {total} tables free
                <span className="font-medium text-state-successSolid/70">
                  {' '}
                  for {guests} {guests === 1 ? 'guest' : 'guests'} at {slot}
                </span>
              </span>
            </>
          )}
        </div>

        {/* --------------------------------------------------------- handoff */}
        <Link
          to={picker.href}
          aria-disabled={!picker.ready}
          onClick={(e) => {
            if (!picker.ready) e.preventDefault()
          }}
          className={cn(
            'group focus-ring mt-4 inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white transition',
            picker.ready
              ? 'bg-brand-bright shadow-[0_8px_24px_rgba(192,22,26,.32)] hover:bg-brand-600'
              : 'pointer-events-none bg-ink-faint',
          )}
        >
          {free === 0 ? 'See other times' : 'Choose your table'}
          <ArrowRight className="size-[16px] transition-transform group-hover:translate-x-1" />
        </Link>

        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-ink-faint">
          Free to book · no account needed
          {rules?.requireApproval ? ' · held while the restaurant confirms' : ''}
        </p>
      </div>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: string; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-faint"
    >
      {children}
    </label>
  )
}

function Stepper({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="focus-ring flex size-[30px] items-center justify-center rounded-[6px] text-ink-soft transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-ink-faint/50 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

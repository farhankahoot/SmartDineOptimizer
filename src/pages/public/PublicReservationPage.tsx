import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  Info,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  ShieldCheck,
  Sofa,
  Star,
  Store,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import {
  EntranceSign,
  FloorPlan,
  Plant,
  Planter,
  PrivateRoom,
  Wall,
} from '@/components/floorplan/FloorPlan'
import { type FloorTable } from '@/data/tables'
import { fieldErrorsOf, messageOf } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { useReservations } from '@/store/ReservationsContext'
import {
  occasionTypes,
  seatingPreferences,
  type Reservation,
  type SeatingPreference,
} from '@/data/reservations'
import { formatBookingDateLong } from '@/lib/date'

const heroBadges = [
  { icon: Zap, title: 'Instant Confirmation', detail: 'Get confirmed in seconds', ring: '#C9A24A' },
  { icon: Mail, title: 'SMS/Email Reminder', detail: "We'll remind you on time", ring: '#E7E3DC' },
  { icon: Radio, title: 'Live Table Availability', detail: 'Real-time updates', ring: '#4FA96A' },
]

const legend = [
  { label: 'Available', color: '#4CAF50' },
  { label: 'Reserved', color: '#D64545' },
  { label: 'Selected', color: '#D9A441' },
  { label: 'Unavailable', color: '#B4B2AE' },
]

/** Fallback slots, used only until the configured ones arrive. */
const fallbackSlots = ['12:30 PM', '1:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '9:00 PM']

/**
 * Bookable dates are generated from today rather than hard-coded, so the form
 * can never offer a date the server will reject. Values are ISO (the format the
 * booking rules parse); the label is what the guest reads.
 */
function bookableDates(advanceDays: number, allowSameDay: boolean) {
  const out: { value: string; label: string }[] = []
  const start = allowSameDay ? 0 : 1
  const span = Math.min(advanceDays, 30)

  for (let i = start; i <= span; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    out.push({ value, label: i === 0 ? `Today · ${label}` : label })
  }
  return out
}

/** Live table availability for the chosen date and slot (Module 3 FE-4). */
interface AvailabilityPayload {
  availableCount: number
  tables: (FloorTable & { id: string })[]
}

interface PublicConfig {
  rules: {
    minPartySize: number
    maxPartySize: number
    advanceDays: number
    allowSameDay: boolean
    requireApproval: boolean
  }
  timeSlots: { id: string; label: string; start: string; end: string; status: string }[]
}

interface FormState {
  fullName: string
  phone: string
  email: string
  date: string
  timeSlot: string
  guests: string
  occasion: string
  seating: SeatingPreference
  note: string
}

const emptyForm: FormState = {
  fullName: '',
  phone: '',
  email: '',
  date: '',
  timeSlot: '',
  guests: '2',
  occasion: '',
  seating: 'No preference',
  note: '',
}

type FormErrors = Partial<Record<keyof FormState | 'table', string>>

export function PublicReservationPage() {
  const { create, findConflict } = useReservations()
  const { push } = useToast()
  const navigate = useNavigate()

  // Booking constraints and open slots come from the restaurant's settings.
  const { data: config } = useApi<PublicConfig>('/public/config')
  const rules = config?.rules
  const dateOptions = bookableDates(rules?.advanceDays ?? 30, rules?.allowSameDay ?? true)
  const slotOptions = config?.timeSlots.length
    ? config.timeSlots.map((t) => t.start)
    : fallbackSlots
  const maxGuests = rules?.maxPartySize ?? 12
  const guestOptions = Array.from({ length: maxGuests }, (_, i) => `${i + 1}`)

  const [selected, setSelected] = useState<FloorTable | undefined>()
  const [form, setForm] = useState<FormState>(emptyForm)

  // The floor plan shows the restaurant's real tables, with each one marked
  // available or taken for the date and slot the guest has chosen.
  const availability = useApi<AvailabilityPayload>(
    form.date && form.timeSlot ? '/public/availability' : null,
    { date: form.date, timeSlot: form.timeSlot, guests: form.guests },
  )
  const floorTables = availability.data?.tables ?? []

  // A table that stops being available when the date or slot changes must not
  // stay selected, or the guest would submit a booking the server will refuse.
  useEffect(() => {
    if (!selected) return
    const match = floorTables.find((t) => t.id === selected.id)
    if (floorTables.length > 0 && (!match || match.status !== 'Available')) {
      setSelected(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability.data])

  // Seed the date and slot from the live options the moment they arrive.
  useEffect(() => {
    if (!config) return
    setForm((f) => ({
      ...f,
      date: dateOptions.some((d) => d.value === f.date) ? f.date : (dateOptions[0]?.value ?? ''),
      timeSlot: slotOptions.includes(f.timeSlot) ? f.timeSlot : (slotOptions[0] ?? ''),
    }))
    // dateOptions/slotOptions are derived from config, so config is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState<Reservation | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const pickTable = (t: FloorTable) => {
    if (t.status === 'Unavailable' || t.status === 'Reserved') return
    setSelected(t)
    setErrors((e) => ({ ...e, table: undefined }))
  }

  const validate = () => {
    const next: FormErrors = {}
    if (!form.fullName.trim()) next.fullName = 'Please enter your full name.'
    else if (form.fullName.trim().length < 3) next.fullName = 'Name must be at least 3 characters.'

    if (!form.phone.trim()) next.phone = 'Please enter a phone number.'
    else if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number.'

    if (!form.email.trim()) next.email = 'Please enter an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Enter a valid email address.'

    if (!form.date) next.date = 'Choose a date.'
    if (!form.timeSlot) next.timeSlot = 'Choose a time slot.'
    if (!form.guests) next.guests = 'Choose the number of guests.'

    // Module 1 FE-4/FE-5 — a table must be picked before the request is sent.
    if (!selected) next.table = 'Select a table on the floor plan before confirming.'
    else if (Number(form.guests) > selected.seats)
      next.table = `Table ${selected.id} seats ${selected.seats}. Pick a larger table for ${form.guests} guests.`
    else if (findConflict(selected.id, form.date, form.timeSlot))
      next.table = `Table ${selected.id} is already held for ${form.timeSlot} on ${form.date}. Please choose another.`

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      push({ tone: 'error', title: 'Please check the form', detail: 'Some required details are missing.' })
      return
    }

    setSubmitting(true)

    try {
      const record = await create({
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        date: form.date,
        timeSlot: form.timeSlot,
        guests: Number(form.guests),
        occasion: form.occasion || 'Other',
        seating: form.seating,
        table: selected!.id,
        specialRequest: form.note.trim(),
        source: 'Website Booking',
      })

      setBooked(record)
      push({
        tone: 'success',
        title: 'Reservation request sent',
        detail: `Reference ${record.reference}. Awaiting restaurant approval.`,
      })
    } catch (err) {
      // The server is the authority on availability and booking rules, so its
      // message is shown rather than a generic failure.
      setErrors(fieldErrorsOf(err))
      push({
        tone: 'error',
        title: 'Reservation not saved',
        detail: messageOf(err, 'The booking could not be saved. Please try again.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const tables = floorTables.map((t) =>
    t.id === selected?.id ? { ...t, status: 'Selected' as const } : t,
  )

  // Module 1 FE-5 — success state confirming the request reached the restaurant.
  if (booked) {
    return (
      <div className="min-h-full bg-[#F6F4F1]">
        <div className="relative overflow-hidden bg-[#150E09]">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(120% 90% at 20% 0%, #3A2A1C 0%, #241811 45%, #150E09 100%)',
            }}
          />
          <PublicHeader activeLabel="Reservation" />
        </div>

        <main className="mx-auto max-w-[640px] px-5 py-12">
          <div className="rounded-[14px] border border-line bg-white p-6 text-center shadow-panel sm:p-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EAF6EC]">
              <CheckCircle2 className="size-8 text-state-success" strokeWidth={2} />
            </span>

            <h1 className="mt-4 text-[22px] font-extrabold text-ink">Reservation request sent</h1>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-ink-muted">
              Thanks {booked.customerName.split(' ')[0]} — the restaurant has your request and will
              confirm shortly. We&apos;ve sent the details to {booked.email}.
            </p>

            <div className="mx-auto mt-5 flex max-w-[320px] items-center justify-between gap-3 rounded-[10px] border border-dashed border-brand-300 bg-brand-50 px-4 py-3">
              <div className="text-left">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                  Booking reference
                </p>
                <p className="mt-0.5 text-[17px] font-extrabold text-brand-700">{booked.reference}</p>
              </div>
              <button
                type="button"
                aria-label="Copy booking reference"
                onClick={() => {
                  void navigator.clipboard?.writeText(booked.reference)
                  push({ tone: 'info', title: 'Reference copied' })
                }}
                className="focus-ring rounded-lg p-1.5 text-brand-700 transition hover:bg-white"
              >
                <Copy className="size-[16px]" />
              </button>
            </div>

            <dl className="mt-5 grid gap-x-5 gap-y-3 text-left sm:grid-cols-2">
              {[
                ['Date', formatBookingDateLong(booked.date)],
                ['Time slot', booked.timeSlot],
                ['Guests', `${booked.guests} guests`],
                ['Table', booked.table],
                ['Occasion', booked.occasion],
                ['Seating preference', booked.seating],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[9px] bg-[#FBF9F7] px-3 py-2.5">
                  <dt className="text-[11px] text-ink-muted">{k}</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="size-[16px]" />}
                onClick={() =>
                  navigate(
                    `/track?ref=${booked.reference}&contact=${encodeURIComponent(booked.email)}`,
                  )
                }
              >
                Track this reservation
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setBooked(null)
                  setForm(emptyForm)
                  setSelected(undefined)
                }}
              >
                Book another table
              </Button>
            </div>

            <p className="mt-5 text-[11.5px] text-ink-faint">
              Your table is held for 10 minutes while the restaurant reviews the request.
            </p>
          </div>

          <p className="mt-5 text-center text-[12px] text-ink-muted">
            Need help?{' '}
            <a href="tel:03331234567" className="font-semibold text-brand-700 hover:underline">
              Call 0333 1234567
            </a>{' '}
            or{' '}
            <Link to="/track" className="font-semibold text-brand-700 hover:underline">
              check your booking status
            </Link>
            .
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#F6F4F1]">
      {/* ------------------------------------------------------------ hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#1B120C]"
          style={{
            backgroundImage:
              'radial-gradient(120% 90% at 20% 0%, #3A2A1C 0%, #241811 45%, #150E09 100%)',
          }}
        />
        {/* Warm restaurant-interior scene behind the hero copy: pendant lamps,
            a glowing back wall and greenery, dimmed by a dark overlay. */}
        <div className="absolute inset-x-0 bottom-0 top-[58px] overflow-hidden" aria-hidden="true">
          <div className="size-full bg-[radial-gradient(closest-side_at_30%_26%,rgba(232,186,104,.55),transparent_62%),radial-gradient(closest-side_at_58%_14%,rgba(244,206,138,.45),transparent_58%),radial-gradient(closest-side_at_86%_52%,rgba(118,158,88,.35),transparent_62%),radial-gradient(closest-side_at_12%_70%,rgba(180,130,70,.28),transparent_60%)]" />

          {[
            { left: '24%', top: '4%', w: 66 },
            { left: '44%', top: '-2%', w: 82 },
            { left: '62%', top: '6%', w: 58 },
            { left: '78%', top: '0%', w: 48 },
          ].map((lamp) => (
            <div key={lamp.left} className="absolute" style={{ left: lamp.left, top: lamp.top }}>
              <span className="mx-auto block h-6 w-px bg-white/15" style={{ marginLeft: lamp.w / 2 }} />
              <span
                className="block rounded-[3px] bg-[linear-gradient(180deg,rgba(226,196,146,.5),rgba(196,158,102,.32))] shadow-[0_18px_60px_28px_rgba(232,186,104,.22)]"
                style={{ width: lamp.w, height: lamp.w * 0.42 }}
              />
            </div>
          ))}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,14,9,.62),rgba(21,14,9,.88))]" />
        </div>

        <PublicHeader activeLabel="Reservation" />

        {/* Hero copy + trust badges */}
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
          <div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[38px]">
              Reserve Your Table
            </h1>
            <p className="mt-2 max-w-[440px] text-[13.5px] text-white/85 sm:text-[15px]">
              Select your preferred table and enjoy an exceptional dining experience.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-[12px] border border-white/12 bg-black/45 p-2.5 backdrop-blur-[2px] sm:gap-5 sm:p-3.5 sm:px-5">
            {heroBadges.map(({ icon: Icon, title, detail, ring }) => (
              <div key={title} className="flex items-center gap-1.5 sm:gap-2.5">
                <span
                  className="flex size-[24px] shrink-0 items-center justify-center rounded-full border sm:size-[30px]"
                  style={{ borderColor: ring, color: ring }}
                >
                  <Icon className="size-[12px] sm:size-[14px]" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 leading-[1.25] sm:leading-tight">
                  <p className="text-[9px] font-bold text-white sm:text-[11.5px]">{title}</p>
                  <p className="text-[8px] text-white/70 sm:text-[10.5px]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- content */}
      <main
        id="reservation"
        className="relative z-10 mx-auto -mt-6 grid max-w-[1320px] gap-5 px-5 pb-10 lg:grid-cols-[minmax(0,466px)_minmax(0,1fr)]"
      >
        {/* Reservation form */}
        <section className="rounded-[14px] border border-line bg-white p-5 shadow-panel">
          <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-ink">
            <CalendarDays className="size-[18px] text-brand-600 lg:hidden" strokeWidth={2.2} />
            Your Reservation Details
          </h2>

          <form id="reservation-form" noValidate className="mt-4 grid grid-cols-2 gap-3.5" onSubmit={onSubmit}>
            {/* One 2-column grid drives both mockups: on mobile every field is
                half-width; from lg the name, seating and note span the full row. */}
            <div className="lg:col-span-2">
              <Label htmlFor="full-name" required>
                Full Name
              </Label>
              <Input
                id="full-name"
                icon={<User />}
                placeholder="Enter your full name"
                value={form.fullName}
                error={errors.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
              <FieldError>{errors.fullName}</FieldError>
            </div>

            <div>
              <Label htmlFor="phone" required>
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                icon={<Phone />}
                placeholder="Enter your phone number"
                value={form.phone}
                error={errors.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
              <FieldError>{errors.phone}</FieldError>
            </div>

            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                icon={<Mail />}
                placeholder="Enter your email address"
                value={form.email}
                error={errors.email}
                onChange={(e) => set('email', e.target.value)}
              />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div>
              <Label htmlFor="date" required>
                Date
              </Label>
              <Select
                id="date"
                icon={<CalendarDays />}
                className="font-semibold"
                value={form.date}
                error={errors.date}
                onChange={(e) => set('date', e.target.value)}
                options={dateOptions}
              />
              <FieldError>{errors.date}</FieldError>
            </div>

            <div>
              <Label htmlFor="slot" required>
                Time Slot
              </Label>
              <Select
                id="slot"
                icon={<Clock />}
                className="font-semibold"
                value={form.timeSlot}
                error={errors.timeSlot}
                onChange={(e) => set('timeSlot', e.target.value)}
                options={slotOptions.map((t) => ({ value: t, label: t }))}
              />
              <FieldError>{errors.timeSlot}</FieldError>
            </div>

            <div>
              <Label htmlFor="guests" required>
                Number of Guests
              </Label>
              <Select
                id="guests"
                icon={<User />}
                value={form.guests}
                error={errors.guests}
                onChange={(e) => set('guests', e.target.value)}
                options={guestOptions.map((g) => ({
                  value: g,
                  label: `${g} ${g === '1' ? 'Guest' : 'Guests'}`,
                }))}
              />
              <FieldError>{errors.guests}</FieldError>
            </div>

            <div>
              <Label htmlFor="occasion">Occasion Type</Label>
              <Select
                id="occasion"
                icon={<Gift />}
                value={form.occasion}
                placeholder="Select occasion"
                onChange={(e) => set('occasion', e.target.value)}
                options={occasionTypes.map((o) => ({ value: o, label: o }))}
              />
            </div>

            {/* BO-2 / Module 1 FE-3 — seating preference is a required booking parameter. */}
            <div className="col-span-2">
              <Label htmlFor="seating">Seating Preference</Label>
              <Select
                id="seating"
                icon={<Sofa />}
                value={form.seating}
                onChange={(e) => set('seating', e.target.value as SeatingPreference)}
                options={seatingPreferences.map((o) => ({ value: o, label: o }))}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="note" hint="(Optional)">
                Special Request
              </Label>
              <Textarea
                id="note"
                rows={3}
                maxLength={250}
                value={form.note}
                onChange={(e) => set('note', e.target.value)}
                icon={<MessageSquare />}
                placeholder="Birthday setup, family seating, window-side table, business dinner arrangement..."
                counter={`${form.note.length}/250`}
              />
            </div>

            {errors.table && (
              <p className="col-span-2 -mt-1">
                <FieldError>{errors.table}</FieldError>
              </p>
            )}

            {/* Desktop keeps the CTA inside the form card; on mobile the mockup
                moves it below the floor plan (see the lg:hidden block further down). */}
            <Button
              type="submit"
              size="lg"
              block
              disabled={submitting}
              className="col-span-2 hidden lg:flex"
              leftIcon={
                submitting ? (
                  <Loader2 className="size-[17px] animate-spin" />
                ) : (
                  <CalendarDays className="size-[17px]" />
                )
              }
            >
              {submitting ? 'Sending request…' : 'Confirm Reservation'}
            </Button>
          </form>

          <ul className="mt-4 hidden gap-2 sm:grid-cols-3 lg:grid">
            {[
              { icon: CheckCircle2, title: 'Instant Confirmation', detail: 'Confirmed in real-time' },
              { icon: MessageSquare, title: 'SMS/Email Reminder', detail: "You'll be reminded" },
              { icon: ShieldCheck, title: 'Secure & Reliable', detail: 'Your data is protected' },
            ].map(({ icon: Icon, title, detail }) => (
              <li
                key={title}
                className="flex items-center gap-1.5 rounded-[9px] border border-line bg-[#FCFBFA] px-2 py-2"
              >
                <Icon className="size-[15px] shrink-0 text-brand-600" strokeWidth={1.9} />
                <div className="min-w-0 leading-[1.3]">
                  <p className="text-[9.5px] font-bold text-ink">{title}</p>
                  <p className="text-[8.5px] text-ink-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden items-start gap-2.5 rounded-[9px] bg-[#FDF3DC] px-3 py-2.5 lg:flex">
            <Info className="mt-0.5 size-[16px] shrink-0 text-[#B9862B]" strokeWidth={2} />
            <div>
              <p className="text-[12px] font-bold text-ink">Your table is held for 10 minutes</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                Complete your booking to secure your reservation.
              </p>
            </div>
          </div>
        </section>

        {/* Floor plan */}
        <section className="rounded-[14px] border border-line bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-ink">
              <TableIcon className="size-[18px] text-brand-600 lg:hidden" strokeWidth={2.2} />
              Select Your Preferred Table
            </h2>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span className="size-[7px] rounded-full bg-state-success" />
              Live availability
              <span className="mx-1 text-ink-faint">•</span>
              Last updated: 10:24:30 AM
            </p>
          </div>

          <ul className="mt-3.5 grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            {legend.map((l) => (
              <li
                key={l.label}
                className="inline-flex items-center justify-center gap-1.5 rounded-[8px] py-1 sm:justify-start sm:gap-2 sm:border sm:border-line sm:bg-white sm:px-3 sm:py-1.5"
              >
                <span className="size-[10px] shrink-0 rounded-[3px] sm:size-[11px]" style={{ background: l.color }} />
                <span className="text-[10px] font-medium text-ink-soft sm:text-[11.5px]">{l.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3.5">
            <FloorPlan variant="guest" tables={tables} selectedId={selected?.id} onSelect={pickTable} aspect="62%">
              <EntranceSign left="42%" top="-1%" />

              {/*
                The room is laid out in section bands — window side, main hall,
                terrace, then the private rooms — so the decor marks those
                boundaries rather than the old fixed eight-table arrangement.
              */}
              <Wall style={{ left: '0%', top: '2%', width: '40%', height: '1.4%' }} />
              <Wall style={{ left: '54%', top: '2%', width: '46%', height: '1.4%' }} />

              <Planter style={{ left: '4%', top: '20.5%', width: '92%', height: '2.2%' }} />
              <Planter style={{ left: '4%', top: '58.5%', width: '92%', height: '2.2%' }} />

              <PrivateRoom style={{ left: '2%', top: '78%', width: '96%', height: '20%' }} />

              <Plant style={{ right: '1.5%', top: '21%' }} size={22} />
              <Plant style={{ left: '1.5%', top: '40%' }} size={22} />
              <Plant style={{ right: '1.5%', top: '59%' }} size={22} />
            </FloorPlan>
          </div>

          {/* Selection summary */}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[10px] border border-line bg-[#FDFBF7] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Star className="size-[19px] fill-gold-400 text-gold-400" />
              <span className="text-[15px] font-extrabold text-ink">
                {selected ? `Table ${selected.id}` : 'No table selected'}
              </span>
              {selected && (
                <span className="rounded-[6px] bg-gold-100 px-2.5 py-[3px] text-[11px] font-semibold text-gold-600">
                  Selected
                </span>
              )}
            </div>

            {selected && (
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-ink-soft">
                <li className="flex items-center gap-1.5">
                  <Users className="size-[14px] text-ink-muted" /> {selected.seats} Seater
                </li>
                <li className="hidden h-3.5 w-px bg-line sm:block" />
                <li className="flex items-center gap-1.5">
                  {selected.type === 'Private' ? (
                    <Lock className="size-[14px] text-ink-muted" />
                  ) : (
                    <Store className="size-[14px] text-ink-muted" />
                  )}
                  {selected.type === 'Private' ? 'Private Room' : 'Indoor'}
                </li>
                <li className="hidden h-3.5 w-px bg-line sm:block" />
                <li className="flex items-center gap-1.5">
                  <LayoutGrid className="size-[14px] text-ink-muted" /> Near Window
                </li>
              </ul>
            )}

            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setSelected(undefined)}
            >
              Change Table
            </Button>
          </div>

          {/* Mobile mockup places the trust row + primary CTA below the floor plan. */}
          <div className="mt-3.5 lg:hidden">
            <ul className="grid grid-cols-3 gap-1.5 rounded-[9px] bg-[#FDF6E6] p-2">
              {[
                { icon: Zap, title: 'Instant Confirmation', detail: 'Confirmed in seconds' },
                { icon: Mail, title: 'SMS/Email Reminder', detail: "We'll remind you" },
                { icon: Radio, title: 'Live Table Availability', detail: 'Real-time updates' },
              ].map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex items-center gap-1.5">
                  <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full border border-brand-300 text-brand-600">
                    <Icon className="size-[12px]" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 leading-[1.25]">
                    <p className="text-[9px] font-bold text-ink">{title}</p>
                    <p className="text-[8px] text-ink-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              type="submit"
              form="reservation-form"
              size="lg"
              block
              disabled={submitting}
              className="mt-3"
              leftIcon={
                submitting ? (
                  <Loader2 className="size-[17px] animate-spin" />
                ) : (
                  <CalendarDays className="size-[17px]" />
                )
              }
            >
              {submitting ? 'Sending request…' : 'Confirm Reservation'}
            </Button>

            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
              <ShieldCheck className="size-[13px]" />
              Your data is secure and protected.
            </p>
          </div>
        </section>
      </main>

      {/* Availability banner */}
      <div className="mx-auto max-w-[1320px] px-5 pb-10">
        {selected ? (
          <div className="flex items-start gap-3 rounded-[10px] border border-state-success/25 bg-[#EAF6EC] px-4 py-3">
            <CheckCircle2 className="mt-0.5 size-[20px] shrink-0 fill-state-success text-white" />
            <div>
              <p className="text-[12.5px] font-bold text-ink">
                Great choice! Table {selected.id} is available.
              </p>
              <p className="mt-0.5 text-[11.5px] text-ink-soft">
                Click &quot;Confirm Reservation&quot; to complete your booking.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-[10px] border border-gold-300 bg-[#FDF6E6] px-4 py-3">
            <Info className="mt-0.5 size-[20px] shrink-0 text-[#B9862B]" />
            <div>
              <p className="text-[12.5px] font-bold text-ink">Pick a table to continue.</p>
              <p className="mt-0.5 text-[11.5px] text-ink-soft">
                Choose any green table on the floor plan to hold it for your booking.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

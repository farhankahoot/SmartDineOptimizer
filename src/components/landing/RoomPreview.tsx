import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  EntranceSign,
  FloorPlan,
  Plant,
  Planter,
  PrivateRoom,
  Wall,
} from '@/components/floorplan/FloorPlan'
import type { FloorTable } from '@/data/tables'
import { cn } from '@/lib/cn'
import type { AvailabilityPayload, BookingPicker } from './BookingStarter'

/**
 * The room, as it actually is right now.
 *
 * This is the same `FloorPlan` the booking page and the console render, fed by
 * the same `/public/availability` endpoint — so the green tables here are
 * genuinely free for the date and slot chosen in the hero. Nothing about it is
 * a picture of the product.
 *
 * It is deliberately not selectable. Choosing a table is a booking decision and
 * belongs on the booking page, where the guest's details are captured in the
 * same step; a half-made choice that evaporates on navigation would be worse
 * than no choice at all. Clicking anywhere here goes there, carrying the date,
 * slot and party size with it.
 */
export function RoomPreview({
  picker,
  availability,
  loading,
  bookingOpen,
}: {
  picker: BookingPicker
  availability: AvailabilityPayload | null
  loading: boolean
  bookingOpen: boolean
}) {
  const tables = (availability?.tables ?? []) as FloorTable[]

  // Section counts, so the claim under the plan is derived rather than written.
  const bySection = new Map<string, { free: number; total: number }>()
  for (const t of availability?.tables ?? []) {
    const row = bySection.get(t.section) ?? { free: 0, total: 0 }
    row.total += 1
    if (t.status === 'Available') row.free += 1
    bySection.set(t.section, row)
  }
  const sections = [...bySection.entries()].sort((a, b) => b[1].total - a[1].total)

  /*
   * "today" and "tomorrow" are adverbs and take no preposition; a weekday
   * does. Writing `on {name}` for all three produced "on today".
   */
  const chosen = picker.dates.find((d) => d.value === picker.date)
  const when = !chosen
    ? 'for your date'
    : chosen.name === 'Today' || chosen.name === 'Tomorrow'
      ? chosen.name.toLowerCase()
      : `on ${new Date(`${picker.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })}`

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
      {/* ------------------------------------------------------- the plan */}
      <div className="relative">
        {tables.length === 0 ? (
          <div className="aspect-[100/62] w-full animate-pulse rounded-[10px] border-[6px] border-[#4A342A] bg-[#EFE2C8]" />
        ) : (
          <div className={cn('transition-opacity duration-300', loading && 'opacity-60')}>
            <FloorPlan variant="guest" tables={tables} aspect="62%">
              <EntranceSign left="42%" top="-1%" />

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
        )}

        {/*
          "Already taken" would be a false claim here. The availability
          endpoint filters on party size as well as on existing bookings, so a
          free two-seater is returned as unavailable to a party of eight. The
          red state means "not available to you", which covers both.
        */}
        <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {[
            { label: 'Free for your party', color: '#6B9E52' },
            { label: 'Not available', color: '#B03A3A' },
            { label: 'Not in service', color: '#9E9C97' },
          ].map((l) => (
            <li key={l.label} className="flex items-center gap-2 text-[11.5px] text-ink-muted">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: l.color }}
                aria-hidden="true"
              />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      {/* -------------------------------------------------------- the copy */}
      <div>
        <h3 className="text-balance text-[23px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[27px]">
          This is the actual room,
          <br />
          {picker.ready ? (
            <span className="text-brand-700">
              free tables at {picker.slot} {when}.
            </span>
          ) : (
            <span className="text-brand-700">live as you choose.</span>
          )}
        </h3>

        <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">
          Not a seating chart drawn for a website — this is the restaurant&apos;s own floor plan, and
          the green tables are the ones that are free <em className="not-italic font-semibold">and</em>{' '}
          big enough for {picker.guests} {picker.guests === 1 ? 'guest' : 'guests'} at the time you
          picked above. Change the party or the time and watch it redraw.
        </p>

        {sections.length > 0 && (
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {sections.map(([name, row]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-white px-3.5 py-2.5"
              >
                <span className="truncate text-[12.5px] font-semibold text-ink-soft">{name}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                    row.free === 0
                      ? 'bg-state-neutralBg text-state-neutral'
                      : 'bg-state-successBg text-state-successSolid',
                  )}
                >
                  {row.free} of {row.total}
                </span>
              </li>
            ))}
          </ul>
        )}

        {bookingOpen && (
          <Link
            to={picker.href}
            className="group focus-ring mt-7 inline-flex h-[46px] items-center gap-2 rounded-full bg-brand-700 px-7 text-[13.5px] font-bold text-white transition hover:bg-brand-600"
          >
            Pick your table
            <ArrowRight className="size-[15px] transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  )
}

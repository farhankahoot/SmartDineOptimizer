import { useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Search, Users } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label, Select } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { useReservations } from '@/store/ReservationsContext'
import type { FloorTable } from '@/data/tables'
import { bookableDateOptions } from '@/lib/date'

const dates = bookableDateOptions()
const slots = ['12:30 PM', '1:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM']
const parties = ['2', '4', '6', '8', '10']

/**
 * Module 3 FE-4/FE-5 — check which tables are free for a date + slot before
 * confirming a booking, and surface the ones already held.
 */
export function AvailabilityChecker({ tables }: { tables: FloorTable[] }) {
  const { findConflict } = useReservations()

  const [date, setDate] = useState(dates[0].value)
  const [slot, setSlot] = useState('8:00 PM')
  const [party, setParty] = useState('4')
  const [result, setResult] = useState<{ free: FloorTable[]; taken: { table: FloorTable; by: string }[] } | null>(
    null,
  )

  const check = () => {
    const size = Number(party)
    const free: FloorTable[] = []
    const taken: { table: FloorTable; by: string }[] = []

    for (const t of tables) {
      if (t.status === 'Blocked' || t.status === 'Unavailable') continue
      if (t.seats < size) continue
      const clash = findConflict(t.id, date, slot)
      if (clash) taken.push({ table: t, by: clash.customerName })
      else free.push(t)
    }
    setResult({ free, taken })
  }

  return (
    <Card className="p-4">
      <SectionTitle uppercase icon={<Search className="size-[16px]" strokeWidth={2.4} />}>
        Check Table Availability
      </SectionTitle>
      <p className="mt-1 text-[11.5px] text-ink-muted">
        Confirms a table is free for the requested date and slot before a booking is accepted.
      </p>

      <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <div>
          <Label htmlFor="av-date">Date</Label>
          <Select
            id="av-date"
            icon={<CalendarDays />}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setResult(null)
            }}
            options={dates}
          />
        </div>
        <div>
          <Label htmlFor="av-slot">Time slot</Label>
          <Select
            id="av-slot"
            icon={<Clock />}
            value={slot}
            onChange={(e) => {
              setSlot(e.target.value)
              setResult(null)
            }}
            options={slots.map((d) => ({ value: d, label: d }))}
          />
        </div>
        <div>
          <Label htmlFor="av-party">Party size</Label>
          <Select
            id="av-party"
            icon={<Users />}
            value={party}
            onChange={(e) => {
              setParty(e.target.value)
              setResult(null)
            }}
            options={parties.map((d) => ({ value: d, label: `${d} guests` }))}
          />
        </div>
        <Button className="h-[42px]" leftIcon={<Search className="size-[15px]" />} onClick={check}>
          Check availability
        </Button>
      </div>

      {result && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div
            className={cn(
              'rounded-[10px] border px-3.5 py-3',
              result.free.length > 0
                ? 'border-state-success/25 bg-[#F1F9F3]'
                : 'border-state-danger/25 bg-state-dangerBg',
            )}
          >
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              {result.free.length > 0 ? (
                <CheckCircle2 className="size-[16px] text-state-success" />
              ) : (
                <AlertTriangle className="size-[16px] text-state-danger" />
              )}
              {result.free.length} table{result.free.length === 1 ? '' : 's'} available
            </p>
            <p className="mt-1 text-[11.5px] text-ink-soft">
              {slot} on {date} for {party} guests
            </p>
            {result.free.length > 0 && (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {result.free.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-[6px] border border-state-success/30 bg-white px-2 py-1 text-[11px] font-semibold text-state-success"
                  >
                    {t.id} · {t.seats} seats · {t.section}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[10px] border border-line bg-[#FBF9F7] px-3.5 py-3">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <AlertTriangle className="size-[16px] text-gold-600" />
              {result.taken.length} already held
            </p>
            <p className="mt-1 text-[11.5px] text-ink-soft">
              These tables cannot be double booked for this slot.
            </p>
            {result.taken.length > 0 ? (
              <ul className="mt-2.5 grid gap-1">
                {result.taken.map(({ table, by }) => (
                  <li key={table.id} className="text-[11px] text-ink-soft">
                    <span className="font-semibold text-ink">{table.id}</span> — held by {by}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-ink-faint">No conflicts for this slot.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  Hash,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Sofa,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/States'
import { StatusBadge, StatusTimeline } from '@/components/reservation/StatusTimeline'
import { useReservations } from '@/store/ReservationsContext'
import type { Reservation } from '@/data/reservations'

const statusCopy: Record<Reservation['status'], string> = {
  Pending: 'Your request is with the restaurant. You will hear back shortly.',
  Confirmed: 'Your table is confirmed. We look forward to serving you.',
  Updated: 'The restaurant revised your booking. Please review the details below.',
  Rejected: 'Unfortunately this slot could not be accommodated. Please try another time.',
  Cancelled: 'This reservation has been cancelled.',
  Completed: 'Thank you for dining with us.',
}

/** Module 1 FE-6 — customers look up a booking and see its current status. */
export function TrackReservationPage() {
  const { lookup } = useReservations()
  const [params] = useSearchParams()

  const [reference, setReference] = useState(params.get('ref') ?? '')
  const [contact, setContact] = useState(params.get('contact') ?? '')
  const [errors, setErrors] = useState<{ reference?: string; contact?: string }>({})
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const [result, setResult] = useState<Reservation | undefined>()

  const run = async (ref: string, key: string) => {
    setBusy(true)
    await new Promise((r) => setTimeout(r, 550))
    setResult(lookup(ref, key))
    setSearched(true)
    setBusy(false)
  }

  // Deep link from the booking confirmation screen.
  useEffect(() => {
    const ref = params.get('ref')
    const key = params.get('contact')
    if (ref && key) void run(ref, key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!reference.trim()) next.reference = 'Enter the booking reference from your confirmation.'
    if (!contact.trim()) next.contact = 'Enter the email or phone used for the booking.'
    setErrors(next)
    if (Object.keys(next).length) return
    void run(reference, contact)
  }

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
        <PublicHeader activeLabel="Track Booking" />

        <div className="relative z-10 mx-auto max-w-[1320px] px-5 py-10">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[34px]">
            Track Your Reservation
          </h1>
          <p className="mt-2 max-w-[520px] text-[13.5px] text-white/85 sm:text-[15px]">
            Enter your booking reference to see whether your table is pending, confirmed, updated,
            rejected or cancelled.
          </p>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1320px] gap-5 px-5 py-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <section className="h-fit rounded-[14px] border border-line bg-white p-5 shadow-panel">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
            <Search className="size-[17px] text-brand-600" strokeWidth={2.2} />
            Find your booking
          </h2>

          <form onSubmit={onSubmit} noValidate className="mt-4 grid gap-3.5">
            <div>
              <Label htmlFor="track-ref" required>
                Booking reference
              </Label>
              <Input
                id="track-ref"
                icon={<Hash />}
                placeholder="RES-2025-1001"
                value={reference}
                error={errors.reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <FieldError>{errors.reference}</FieldError>
            </div>

            <div>
              <Label htmlFor="track-contact" required>
                Email or phone number
              </Label>
              <Input
                id="track-contact"
                icon={<Mail />}
                placeholder="you@example.com"
                value={contact}
                error={errors.contact}
                onChange={(e) => setContact(e.target.value)}
              />
              <FieldError>{errors.contact}</FieldError>
            </div>

            <Button type="submit" size="lg" block disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-[16px] animate-spin" /> Checking…
                </>
              ) : (
                'Check status'
              )}
            </Button>
          </form>

          <div className="mt-4 rounded-[9px] bg-[#FDF3DC] px-3 py-2.5">
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              Your reference was emailed and texted to you when the request was submitted. Try{' '}
              <button
                type="button"
                className="font-bold text-brand-700 hover:underline"
                onClick={() => {
                  setReference('RES-2025-1002')
                  setContact('priya.mehta@gmail.com')
                }}
              >
                a sample booking
              </button>
              .
            </p>
          </div>
        </section>

        <section className="min-w-0">
          {busy && (
            <div className="grid place-items-center rounded-[14px] border border-line bg-white py-24 shadow-panel">
              <Loader2 className="size-6 animate-spin text-brand-600" />
              <p className="mt-3 text-[13px] text-ink-muted">Looking up your reservation…</p>
            </div>
          )}

          {!busy && !searched && (
            <div className="rounded-[14px] border border-line bg-white shadow-panel">
              <EmptyState
                icon={<CalendarDays className="size-6" strokeWidth={1.7} />}
                title="No booking loaded yet"
                detail="Enter your reference and contact detail to see the live status of your reservation."
              />
            </div>
          )}

          {!busy && searched && !result && (
            <div className="rounded-[14px] border border-line bg-white shadow-panel">
              <EmptyState
                title="We couldn't find that reservation"
                detail="Check that the reference and contact detail match the ones on your confirmation message, then try again."
                action={
                  <Button variant="outline" size="sm" onClick={() => setSearched(false)}>
                    Try another reference
                  </Button>
                }
              />
            </div>
          )}

          {!busy && result && (
            <div className="grid gap-4">
              <div className="rounded-[14px] border border-line bg-white p-5 shadow-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-faint">
                      {result.reference}
                    </p>
                    <h2 className="mt-1 text-[20px] font-extrabold text-ink">
                      {result.customerName}
                    </h2>
                  </div>
                  <StatusBadge status={result.status} />
                </div>

                <p className="mt-3 rounded-[9px] bg-[#FBF9F7] px-3.5 py-2.5 text-[12.5px] text-ink-soft">
                  {statusCopy[result.status]}
                </p>

                <dl className="mt-4 grid gap-x-5 gap-y-3.5 sm:grid-cols-2">
                  <Detail icon={<CalendarDays />} label="Date" value={result.date} />
                  <Detail icon={<Clock />} label="Time slot" value={result.timeSlot} />
                  <Detail icon={<Users />} label="Guests" value={`${result.guests} guests`} />
                  <Detail icon={<UtensilsCrossed />} label="Occasion" value={result.occasion} />
                  <Detail icon={<Sofa />} label="Seating preference" value={result.seating} />
                  <Detail
                    icon={<Hash />}
                    label="Table"
                    value={result.status === 'Pending' ? 'Assigned on confirmation' : result.table}
                  />
                  {result.specialRequest && (
                    <div className="sm:col-span-2">
                      <Detail
                        icon={<MessageSquare />}
                        label="Special request"
                        value={result.specialRequest}
                      />
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-[14px] border border-line bg-white p-5 shadow-panel">
                <h3 className="text-[14px] font-extrabold text-ink">Status history</h3>
                <div className="mt-3.5">
                  <StatusTimeline events={result.history} />
                </div>
              </div>

              <p className="text-center text-[12px] text-ink-muted">
                Need to change something?{' '}
                <a href="tel:03331234567" className="font-semibold text-brand-700 hover:underline">
                  Call 0333 1234567
                </a>{' '}
                or{' '}
                <Link to="/reserve" className="font-semibold text-brand-700 hover:underline">
                  make a new reservation
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-ink-faint [&>svg]:size-[15px]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] text-ink-muted">{label}</dt>
        <dd className="mt-0.5 text-[13px] font-semibold text-ink">{value}</dd>
      </div>
    </div>
  )
}

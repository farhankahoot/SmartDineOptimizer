import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Gift,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sofa,
  Users,
  XCircle,
} from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { StatusBadge, StatusTimeline } from '@/components/reservation/StatusTimeline'
import { ReservationFormModal } from '@/components/reservation/ReservationFormModal'
import { useReservations } from '@/store/ReservationsContext'
import { useAuth } from '@/auth/AuthContext'
import { historyStatuses } from '@/data/reservations'
import { formatBookingDateLong } from '@/lib/date'

/** Module 2 FE-2/FE-4/FE-5 — full record for a single booking. */
export function ReservationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { allows } = useAuth()
  const { findById, setStatus } = useReservations()

  const [editOpen, setEditOpen] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const reservation = findById(id)
  const canManage = allows('manage:reservations')

  if (!reservation) {
    return (
      <>
        <PageHeader title="Reservation" showProfile={false} onToggleNav={toggle} />
        <div className="px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
          <Card>
            <EmptyState
              title="Reservation not found"
              detail="This booking may have been removed, or the link is out of date."
              action={
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/reservations')}>
                  Back to reservations
                </Button>
              }
            />
          </Card>
        </div>
      </>
    )
  }

  const closed = historyStatuses.includes(reservation.status)

  return (
    <>
      <PageHeader
        title={reservation.customerName}
        showProfile={false}
        notificationCount={5}
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <Link
          to="/admin/reservations"
          className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition hover:text-brand-700"
        >
          <ArrowLeft className="size-[14px]" /> Back to all reservations
        </Link>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid min-w-0 gap-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-faint">
                    {reservation.reference}
                  </p>
                  <h2 className="mt-1 text-[20px] font-extrabold text-ink">
                    {reservation.customerName}
                  </h2>
                  <p className="mt-1 text-[12.5px] text-ink-muted">
                    Booked via {reservation.source}
                  </p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>

              <dl className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail icon={<Phone />} label="Phone" value={reservation.phone} />
                <Detail icon={<Mail />} label="Email" value={reservation.email} />
                <Detail icon={<CalendarDays />} label="Date" value={formatBookingDateLong(reservation.date)} />
                <Detail icon={<Clock />} label="Time slot" value={reservation.timeSlot} />
                <Detail icon={<Users />} label="Guests" value={`${reservation.guests} guests`} />
                <Detail icon={<TableIcon />} label="Selected table" value={reservation.table} />
                <Detail icon={<Gift />} label="Occasion" value={reservation.occasion} />
                <Detail icon={<Sofa />} label="Seating preference" value={reservation.seating} />
              </dl>

              {/* Module 2 FE-4 — special request handling. */}
              <div className="mt-5 rounded-[10px] border border-line bg-[#FBF9F7] px-4 py-3.5">
                <p className="flex items-center gap-2 text-[12px] font-bold text-ink">
                  <MessageSquare className="size-[15px] text-brand-600" />
                  Special request
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink-soft">
                  {reservation.specialRequest || 'No special request was submitted for this booking.'}
                </p>
              </div>

              {canManage && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  {reservation.status === 'Pending' && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        leftIcon={<CheckCircle2 className="size-[14px]" />}
                        onClick={() => {
                          setStatus(reservation.id, 'Confirmed', 'Table assigned and confirmation sent.')
                          push({ tone: 'success', title: 'Reservation confirmed', detail: reservation.reference })
                        }}
                      >
                        Confirm booking
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<XCircle className="size-[14px]" />}
                        onClick={() => setConfirmReject(true)}
                      >
                        Reject booking
                      </Button>
                    </>
                  )}

                  {!closed && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => setEditOpen(true)}>
                        Update details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)}>
                        Cancel booking
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outlineNeutral"
                    size="sm"
                    leftIcon={<Send className="size-[13px]" />}
                    onClick={() =>
                      push({
                        tone: 'success',
                        title: 'Notification queued',
                        detail: `Sent to ${reservation.email}`,
                      })
                    }
                  >
                    Send message
                  </Button>

                  {reservation.status === 'Confirmed' && (
                    <Button
                      variant="outlineSuccess"
                      size="sm"
                      onClick={() => {
                        setStatus(reservation.id, 'Completed', 'Guests seated and visit completed.')
                        push({ tone: 'success', title: 'Marked as completed' })
                      }}
                    >
                      Mark completed
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Module 2 FE-5 — status trail */}
          <Card className="h-fit p-5">
            <h3 className="text-[14px] font-extrabold text-ink">Booking history</h3>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              Every status change is recorded and shared with the customer.
            </p>
            <div className="mt-4">
              <StatusTimeline events={reservation.history} />
            </div>
          </Card>
        </div>
      </div>

      <ReservationFormModal
        open={editOpen}
        reservation={reservation}
        onClose={() => setEditOpen(false)}
        onSaved={(message) => push({ tone: 'success', title: message })}
      />

      <ConfirmDialog
        open={confirmReject}
        title="Reject this reservation?"
        message={`${reservation.customerName} will be notified that ${reservation.reference} could not be accommodated.`}
        confirmLabel="Reject booking"
        onCancel={() => setConfirmReject(false)}
        onConfirm={() => {
          setStatus(reservation.id, 'Rejected', 'No table available for the requested slot.')
          push({ tone: 'info', title: 'Reservation rejected', detail: reservation.reference })
          setConfirmReject(false)
        }}
      />

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this reservation?"
        message={`${reservation.customerName} will receive a cancellation message and table ${reservation.table} will be released.`}
        confirmLabel="Cancel booking"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setStatus(reservation.id, 'Cancelled', 'Cancelled by the restaurant.')
          push({ tone: 'info', title: 'Reservation cancelled', detail: reservation.reference })
          setConfirmCancel(false)
        }}
      />
    </>
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
        <dd className="mt-0.5 break-words text-[13px] font-semibold text-ink">{value}</dd>
      </div>
    </div>
  )
}

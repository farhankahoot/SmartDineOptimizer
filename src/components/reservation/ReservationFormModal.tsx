import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, CalendarDays, Clock, Gift, Mail, Phone, Sofa, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { fieldErrorsOf, messageOf } from '@/lib/api'
import { useReservations } from '@/store/ReservationsContext'
import {
  bookingSources,
  occasionTypes,
  seatingPreferences,
  type Reservation,
  type SeatingPreference,
} from '@/data/reservations'
import { adminFloorTables } from '@/data/tables'
import { timeSlotRows } from '@/data/timeSlots'
import { bookableDateOptions } from '@/lib/date'

// Generated from today, so a manual booking can never carry a past date or a
// format the booking rules cannot parse.
const dates = bookableDateOptions()
const times = ['12:30 PM', '1:00 PM', '1:30 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM']
const tableIds = [...adminFloorTables.map((t) => t.id), 'A05', 'A07', 'A09', 'A12', 'B05', 'B07', 'B09', 'B11', 'B12', 'B14', 'C03', 'C05', 'C07', 'C08', 'D01', 'D02', 'D03']

interface Draft {
  customerName: string
  phone: string
  email: string
  date: string
  timeSlot: string
  guests: string
  occasion: string
  seating: SeatingPreference
  table: string
  specialRequest: string
  source: string
}

const blank: Draft = {
  customerName: '',
  phone: '',
  email: '',
  date: dates[0].value,
  timeSlot: '7:00 PM',
  guests: '2',
  occasion: occasionTypes[0],
  seating: 'No preference',
  table: tableIds[0],
  specialRequest: '',
  source: 'Manual Entry',
}

/**
 * Module 2 FE-2 — one form covers both "Add Reservation" and "Update", and
 * enforces the double-booking guard from Module 3 FE-5 before saving.
 */
export function ReservationFormModal({
  open,
  onClose,
  reservation,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  /** Passing a record switches the modal into edit mode. */
  reservation?: Reservation | null
  onSaved?: (message: string) => void
}) {
  const { create, update, findConflict } = useReservations()
  const editing = Boolean(reservation)

  const [draft, setDraft] = useState<Draft>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setErrors({})
    setReason('')
    setDraft(
      reservation
        ? {
            customerName: reservation.customerName,
            phone: reservation.phone,
            email: reservation.email,
            date: reservation.date,
            timeSlot: reservation.timeSlot,
            guests: String(reservation.guests),
            occasion: reservation.occasion,
            seating: reservation.seating,
            table: reservation.table,
            specialRequest: reservation.specialRequest,
            source: reservation.source,
          }
        : blank,
    )
  }, [open, reservation])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const conflict = findConflict(draft.table, draft.date, draft.timeSlot, reservation?.id)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!draft.customerName.trim()) next.customerName = 'Customer name is required.'
    if (!draft.phone.trim()) next.phone = 'Phone number is required.'
    else if (draft.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number.'
    if (!draft.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
      next.email = 'Enter a valid email address.'
    if (Number(draft.guests) < 1) next.guests = 'At least one guest is required.'
    if (conflict) next.table = `Table ${draft.table} is already held by ${conflict.customerName}.`

    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      customerName: draft.customerName.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      date: draft.date,
      timeSlot: draft.timeSlot,
      guests: Number(draft.guests),
      occasion: draft.occasion,
      seating: draft.seating,
      table: draft.table,
      specialRequest: draft.specialRequest.trim(),
      source: draft.source,
    }

    try {
      if (editing && reservation) {
        await update(
          reservation.id,
          payload,
          reason.trim() || 'Booking details revised by the restaurant.',
        )
        onSaved?.(`Reservation ${reservation.reference} updated.`)
      } else {
        const created = await create(payload)
        onSaved?.(`Reservation ${created.reference} created.`)
      }
      onClose()
    } catch (err) {
      // The server re-checks availability, so a clash caught there is shown
      // against the table field rather than closing the form.
      const details = fieldErrorsOf(err)
      setErrors(Object.keys(details).length ? details : { table: messageOf(err) })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Update ${reservation?.reference}` : 'Add Reservation'}
      subtitle={
        editing
          ? 'Changes are logged to the booking history and notify the customer.'
          : 'Create a booking on behalf of a guest.'
      }
      width="max-w-[640px]"
      footer={
        <>
          <Button variant="outlineNeutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="reservation-admin-form">
            {editing ? 'Save changes' : 'Create reservation'}
          </Button>
        </>
      }
    >
      <form id="reservation-admin-form" noValidate onSubmit={onSubmit} className="grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="rf-name" required>
            Customer Name
          </Label>
          <Input
            id="rf-name"
            icon={<User />}
            placeholder="Full name"
            value={draft.customerName}
            error={errors.customerName}
            onChange={(e) => set('customerName', e.target.value)}
          />
          <FieldError>{errors.customerName}</FieldError>
        </div>

        <div>
          <Label htmlFor="rf-phone" required>
            Phone Number
          </Label>
          <Input
            id="rf-phone"
            icon={<Phone />}
            placeholder="+92 300 000 0000"
            value={draft.phone}
            error={errors.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <FieldError>{errors.phone}</FieldError>
        </div>

        <div>
          <Label htmlFor="rf-email" required>
            Email
          </Label>
          <Input
            id="rf-email"
            icon={<Mail />}
            placeholder="guest@example.com"
            value={draft.email}
            error={errors.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <FieldError>{errors.email}</FieldError>
        </div>

        <div>
          <Label htmlFor="rf-date" required>
            Date
          </Label>
          <Select
            id="rf-date"
            icon={<CalendarDays />}
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            options={dates}
          />
        </div>

        <div>
          <Label htmlFor="rf-slot" required>
            Time Slot
          </Label>
          <Select
            id="rf-slot"
            icon={<Clock />}
            value={draft.timeSlot}
            onChange={(e) => set('timeSlot', e.target.value)}
            options={times.map((t) => ({ value: t, label: t }))}
          />
          <p className="mt-1 text-[10.5px] text-ink-faint">
            {timeSlotRows.length} slots configured for the selected day.
          </p>
        </div>

        <div>
          <Label htmlFor="rf-guests" required>
            Number of Guests
          </Label>
          <Input
            id="rf-guests"
            type="number"
            min={1}
            max={20}
            icon={<User />}
            value={draft.guests}
            error={errors.guests}
            onChange={(e) => set('guests', e.target.value)}
          />
          <FieldError>{errors.guests}</FieldError>
        </div>

        <div>
          <Label htmlFor="rf-occasion">Occasion Type</Label>
          <Select
            id="rf-occasion"
            icon={<Gift />}
            value={draft.occasion}
            onChange={(e) => set('occasion', e.target.value)}
            options={occasionTypes.map((o) => ({ value: o, label: o }))}
          />
        </div>

        <div>
          <Label htmlFor="rf-seating">Seating Preference</Label>
          <Select
            id="rf-seating"
            icon={<Sofa />}
            value={draft.seating}
            onChange={(e) => set('seating', e.target.value as SeatingPreference)}
            options={seatingPreferences.map((o) => ({ value: o, label: o }))}
          />
        </div>

        <div>
          <Label htmlFor="rf-table" required>
            Selected Table
          </Label>
          <Select
            id="rf-table"
            value={draft.table}
            error={errors.table}
            onChange={(e) => set('table', e.target.value)}
            options={[...new Set(tableIds)].map((t) => ({ value: t, label: t }))}
          />
          <FieldError>{errors.table}</FieldError>
        </div>

        <div>
          <Label htmlFor="rf-source">Booking Source</Label>
          <Select
            id="rf-source"
            value={draft.source}
            onChange={(e) => set('source', e.target.value)}
            options={bookingSources.map((o) => ({ value: o, label: o }))}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="rf-request" hint="(Optional)">
            Special Request
          </Label>
          <Textarea
            id="rf-request"
            rows={2}
            value={draft.specialRequest}
            onChange={(e) => set('specialRequest', e.target.value)}
            placeholder="Birthday setup, high chair, quiet corner…"
          />
        </div>

        {editing && (
          <div className="sm:col-span-2">
            <Label htmlFor="rf-reason" hint="(Shown in booking history)">
              Reason for update
            </Label>
            <Input
              id="rf-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Guest asked to move the booking 30 minutes later"
            />
          </div>
        )}

        {/* Module 3 FE-5 — live double-booking warning. */}
        {conflict && (
          <div className="flex items-start gap-2 rounded-[9px] border border-state-danger/25 bg-state-dangerBg px-3 py-2.5 sm:col-span-2">
            <AlertTriangle className="mt-px size-[15px] shrink-0 text-state-danger" />
            <p className="text-[11.5px] text-ink-soft">
              <span className="font-bold text-ink">Double booking:</span> table {draft.table} is
              already held by {conflict.customerName} for {draft.timeSlot} on {draft.date}. Choose a
              different table or slot.
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}

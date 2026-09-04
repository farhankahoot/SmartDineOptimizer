import { useMemo, useState } from 'react'
import { CalendarDays, CircleSlash, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Select } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import {
  slotFilters,
  slotStatuses,
  slotTimeOptions,
  timeSlotRows,
  type SlotStatus,
  type TimeSlotRow,
} from '@/data/timeSlots'

const tone: Record<SlotStatus, BadgeTone> = {
  Open: 'open',
  Full: 'full',
  'Almost Full': 'almostFull',
  Closed: 'closed',
  Blocked: 'blocked',
}

/** Section "2. TIME SLOT MANAGEMENT" — shared by /admin/tables and /admin/time-slots. */
interface Draft {
  start: string
  end: string
  maxReservations: string
  status: SlotStatus
  mealPeriod: string
}

const blankSlot: Draft = {
  start: '6:00 PM',
  end: '8:00 PM',
  maxReservations: '28',
  status: 'Open',
  mealPeriod: 'Dinner',
}

export function TimeSlotModule({ standalone = false }: { standalone?: boolean }) {
  const { push } = useToast()
  const { allows } = useAuth()
  const canManage = allows('manage:slots')

  const [day, setDay] = useState('Saturday')
  const [status, setStatus] = useState('All')
  const [meal, setMeal] = useState('All')
  const [rows, setRows] = useState(timeSlotRows)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TimeSlotRow | null>(null)
  const [draft, setDraft] = useState<Draft>(blankSlot)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [removing, setRemoving] = useState<TimeSlotRow | null>(null)

  const visible = useMemo(
    () => rows.filter((r) => status === 'All' || r.status === status),
    [rows, status],
  )

  const openCreate = () => {
    setEditing(null)
    setDraft(blankSlot)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (r: TimeSlotRow) => {
    setEditing(r)
    setDraft({
      start: r.start,
      end: r.end,
      maxReservations: String(r.maxReservations),
      status: r.status,
      mealPeriod: 'Dinner',
    })
    setErrors({})
    setFormOpen(true)
  }

  const saveSlot = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    const max = Number(draft.maxReservations)

    if (draft.start === draft.end) next.end = 'End time must differ from the start time.'
    if (Number.isNaN(max) || max < 0) next.maxReservations = 'Enter a valid number of reservations.'
    else if (max > 200) next.maxReservations = 'Maximum supported capacity is 200.'

    // Module 3 FE-3 — a slot cannot duplicate an existing window for the same day.
    const clash = rows.find(
      (r) => r.id !== editing?.id && r.start === draft.start && r.end === draft.end,
    )
    if (clash) next.start = `A slot for ${draft.start} - ${draft.end} already exists.`

    setErrors(next)
    if (Object.keys(next).length) return

    const label = `${draft.start} - ${draft.end}`
    if (editing) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                slot: label,
                start: draft.start,
                end: draft.end,
                maxReservations: max,
                status: draft.status,
              }
            : r,
        ),
      )
      push({ tone: 'success', title: 'Time slot updated', detail: label })
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: `S${prev.length + 1}`,
          slot: label,
          start: draft.start,
          end: draft.end,
          maxReservations: max,
          availableTables: max,
          status: draft.status,
        },
      ])
      push({ tone: 'success', title: 'Time slot created', detail: label })
    }
    setFormOpen(false)
  }

  const toggleSlot = (row: TimeSlotRow) => {
    const next: SlotStatus = row.status === 'Closed' || row.status === 'Blocked' ? 'Open' : 'Closed'
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)))
    push({ tone: 'info', title: `${row.slot} ${next === 'Open' ? 'opened' : 'closed'}` })
  }

  const columns: Column<TimeSlotRow>[] = [
    { key: 'slot', header: 'Time Slot', render: (r) => r.slot },
    { key: 'start', header: 'Start Time', align: 'center', render: (r) => r.start },
    { key: 'end', header: 'End Time', align: 'center', render: (r) => r.end },
    { key: 'max', header: 'Max Reservations', align: 'center', render: (r) => r.maxReservations },
    {
      key: 'available',
      header: 'Available Tables',
      align: 'center',
      render: (r) => (r.availableTables === null ? '-' : r.availableTables),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[240px]',
      render: (r) => {
        const closed = r.status === 'Closed' || r.status === 'Blocked'
        if (!canManage) return <span className="text-[11px] text-ink-faint">View only</span>
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Button size="xs" variant="outline" leftIcon={<Pencil className="size-[11px]" />}
              onClick={() => openEdit(r)}
            >
              Edit
            </Button>
            {closed ? (
              <Button
                size="xs"
                variant="outlineSuccess"
                leftIcon={<Clock className="size-[11px]" />}
                onClick={() => toggleSlot(r)}
              >
                Open Slot
              </Button>
            ) : (
              <Button
                size="xs"
                variant="outlineDanger"
                leftIcon={<CircleSlash className="size-[11px]" />}
                onClick={() => toggleSlot(r)}
              >
                Close Slot
              </Button>
            )}
            <Button
              size="xs"
              variant="outlineDanger"
              leftIcon={<Trash2 className="size-[11px]" />}
              onClick={() => setRemoving(r)}
            >
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <Card className="p-4">
      <SectionTitle uppercase icon={<Clock className="size-[17px]" strokeWidth={2.4} />}>
        {standalone ? 'Time Slot Management' : '2. Time Slot Management'}
      </SectionTitle>

      <div className="mt-3.5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Select
            aria-label="Date"
            icon={<CalendarDays />}
            value="May 17, 2025"
            onChange={() => {}}
            className="h-[34px] w-[172px] text-xs"
            options={[{ value: 'May 17, 2025', label: 'May 17, 2025' }]}
          />
          <InlineSelect label="Day Filter:" value={day} onChange={setDay} options={slotFilters.days} width="w-[126px]" />
          <InlineSelect label="Slot Status:" value={status} onChange={setStatus} options={slotFilters.statuses} width="w-[112px]" />
          <InlineSelect label="Meal Period:" value={meal} onChange={setMeal} options={slotFilters.mealPeriods} width="w-[112px]" />
        </div>

        {canManage && (
          <Button size="sm" leftIcon={<Plus className="size-[14px]" />} onClick={openCreate}>
            Add New Slot
          </Button>
        )}
      </div>

      <div className="mt-3.5 overflow-hidden rounded-[10px] border border-line">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Clock className="size-6" strokeWidth={1.7} />}
            title="No time slots match this filter"
            detail="Change the slot status filter, or add a new slot for this day."
            action={
              canManage ? (
                <Button size="sm" variant="outline" onClick={openCreate}>
                  Add New Slot
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataTable columns={columns} rows={visible} rowKey={(r) => r.id} minWidth={880} />
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.slot}` : 'Add New Slot'}
        subtitle="Define a bookable window for the selected day."
        width="max-w-[520px]"
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="slot-form">
              {editing ? 'Save changes' : 'Create slot'}
            </Button>
          </>
        }
      >
        <form id="slot-form" noValidate onSubmit={saveSlot} className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="sl-start" required>
              Start time
            </Label>
            <Select
              id="sl-start"
              value={draft.start}
              error={errors.start}
              onChange={(e) => {
                setDraft((d) => ({ ...d, start: e.target.value }))
                setErrors((x) => ({ ...x, start: undefined }))
              }}
              options={slotTimeOptions.map((t) => ({ value: t, label: t }))}
            />
            <FieldError>{errors.start}</FieldError>
          </div>

          <div>
            <Label htmlFor="sl-end" required>
              End time
            </Label>
            <Select
              id="sl-end"
              value={draft.end}
              error={errors.end}
              onChange={(e) => {
                setDraft((d) => ({ ...d, end: e.target.value }))
                setErrors((x) => ({ ...x, end: undefined }))
              }}
              options={slotTimeOptions.map((t) => ({ value: t, label: t }))}
            />
            <FieldError>{errors.end}</FieldError>
          </div>

          <div>
            <Label htmlFor="sl-max" required>
              Max reservations
            </Label>
            <Input
              id="sl-max"
              type="number"
              min={0}
              max={200}
              value={draft.maxReservations}
              error={errors.maxReservations}
              onChange={(e) => {
                setDraft((d) => ({ ...d, maxReservations: e.target.value }))
                setErrors((x) => ({ ...x, maxReservations: undefined }))
              }}
            />
            <FieldError>{errors.maxReservations}</FieldError>
          </div>

          <div>
            <Label htmlFor="sl-meal">Meal period</Label>
            <Select
              id="sl-meal"
              value={draft.mealPeriod}
              onChange={(e) => setDraft((d) => ({ ...d, mealPeriod: e.target.value }))}
              options={['Lunch', 'Dinner', 'Late Night', 'Peak Hours', 'Special Occasion'].map(
                (m) => ({ value: m, label: m }),
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="sl-status" required>
              Status
            </Label>
            <Select
              id="sl-status"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as SlotStatus }))}
              options={slotStatuses.map((t) => ({ value: t, label: t }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Delete this time slot?"
        message={`${removing?.slot ?? ''} will no longer be bookable. Existing reservations in this slot are not affected.`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            setRows((prev) => prev.filter((x) => x.id !== removing.id))
            push({ tone: 'info', title: 'Time slot deleted', detail: removing.slot })
          }
          setRemoving(null)
        }}
      />
    </Card>
  )
}

function InlineSelect({
  label,
  value,
  onChange,
  options,
  width,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  width: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-[12px] font-bold text-ink">{label}</span>
      <Select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[34px] text-xs ${width}`}
        options={options.map((o) => ({ value: o, label: o }))}
      />
    </div>
  )
}

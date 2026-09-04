import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Select } from '@/components/ui/Field'
import {
  tableSections,
  tableShapes,
  tableStatuses,
  tableTypes,
  type FloorTable,
  type TableSection,
  type TableShape,
  type TableStatus,
  type TableType,
} from '@/data/tables'

interface Draft {
  id: string
  seats: string
  type: TableType
  section: TableSection
  shape: TableShape
  status: TableStatus
}

const blank: Draft = {
  id: '',
  seats: '4',
  type: 'Family',
  section: 'Main Hall',
  shape: 'rect',
  status: 'Available',
}

const shapeLabels: Record<TableShape, string> = {
  round: 'Round',
  rect: 'Rectangular',
  square: 'Square',
}

/** Module 3 FE-1/FE-2 — add or update a table and its seating details. */
export function TableFormModal({
  open,
  onClose,
  table,
  existingIds,
  onSave,
}: {
  open: boolean
  onClose: () => void
  table?: FloorTable | null
  existingIds: string[]
  onSave: (draft: Omit<FloorTable, 'x' | 'y' | 'w' | 'h'>, isEdit: boolean) => void
}) {
  const editing = Boolean(table)
  const [draft, setDraft] = useState<Draft>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    setDraft(
      table
        ? {
            id: table.id,
            seats: String(table.seats),
            type: table.type,
            section: table.section,
            shape: table.shape,
            status: table.status,
          }
        : blank,
    )
  }, [open, table])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    const id = draft.id.trim().toUpperCase()

    if (!id) next.id = 'Table number is required.'
    else if (!/^[A-Z]\d{2}$/.test(id)) next.id = 'Use a letter followed by two digits, e.g. A04.'
    else if (!editing && existingIds.includes(id)) next.id = `Table ${id} already exists.`
    else if (editing && id !== table?.id && existingIds.includes(id))
      next.id = `Table ${id} already exists.`

    const seats = Number(draft.seats)
    if (!seats || seats < 1) next.seats = 'Seating capacity must be at least 1.'
    else if (seats > 20) next.seats = 'Maximum supported capacity is 20.'

    setErrors(next)
    if (Object.keys(next).length) return

    onSave(
      {
        id,
        seats,
        type: draft.type,
        section: draft.section,
        shape: draft.shape,
        status: draft.status,
      },
      editing,
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit table ${table?.id}` : 'Add Table'}
      subtitle="Table number, seating capacity, type and section define how it can be booked."
      width="max-w-[520px]"
      footer={
        <>
          <Button variant="outlineNeutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="table-form">
            {editing ? 'Save changes' : 'Add table'}
          </Button>
        </>
      }
    >
      <form id="table-form" noValidate onSubmit={submit} className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <Label htmlFor="tf-id" required>
            Table number
          </Label>
          <Input
            id="tf-id"
            value={draft.id}
            error={errors.id}
            placeholder="A04"
            onChange={(e) => set('id', e.target.value)}
          />
          <FieldError>{errors.id}</FieldError>
        </div>

        <div>
          <Label htmlFor="tf-seats" required>
            Seating capacity
          </Label>
          <Input
            id="tf-seats"
            type="number"
            min={1}
            max={20}
            value={draft.seats}
            error={errors.seats}
            onChange={(e) => set('seats', e.target.value)}
          />
          <FieldError>{errors.seats}</FieldError>
        </div>

        <div>
          <Label htmlFor="tf-type" required>
            Table type
          </Label>
          <Select
            id="tf-type"
            value={draft.type}
            onChange={(e) => set('type', e.target.value as TableType)}
            options={tableTypes.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <div>
          <Label htmlFor="tf-section" required>
            Seating section
          </Label>
          <Select
            id="tf-section"
            value={draft.section}
            onChange={(e) => set('section', e.target.value as TableSection)}
            options={tableSections.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <div>
          <Label htmlFor="tf-shape">Shape</Label>
          <Select
            id="tf-shape"
            value={draft.shape}
            onChange={(e) => set('shape', e.target.value as TableShape)}
            options={tableShapes.map((t) => ({ value: t, label: shapeLabels[t] }))}
          />
        </div>

        <div>
          <Label htmlFor="tf-status" required>
            Status
          </Label>
          <Select
            id="tf-status"
            value={draft.status}
            onChange={(e) => set('status', e.target.value as TableStatus)}
            options={tableStatuses.map((t) => ({ value: t, label: t }))}
          />
        </div>
      </form>
    </Modal>
  )
}

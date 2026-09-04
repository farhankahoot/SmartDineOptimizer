import { useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  UserRound,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FieldError, Input, Label, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { useAuth } from '@/auth/AuthContext'
import {

  availabilities,
  shiftHours,
  shifts,
  staffRoles,
  type Shift,
  type StaffAvailability,
  type StaffMember,
  type StaffRole,
} from '@/data/staff'
import { api, messageOf } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface StaffPayload {
  staff: StaffMember[]
}

/** Module 4 FE-6 — requirement per shift, computed by the server. */
interface AllocationPayload {
  basis: string
  ratios: { guestsPerServer: number; guestsPerChef: number }
  shifts: {
    shift: Shift
    hours: string
    expectedGuests: number
    reservations: number
    requiredChefs: number
    requiredServing: number
    requiredCleaning: number
  }[]
}

const availabilityTone: Record<StaffAvailability, BadgeTone> = {
  Available: 'confirmed',
  'On Shift': 'completed',
  'Off Duty': 'neutral',
  'On Leave': 'pending',
}

const roleIcon: Record<StaffRole, typeof ChefHat> = {
  Chef: ChefHat,
  'Serving Staff': UserRound,
  'Cleaning Staff': Sparkles,
  'Service Staff': Users,
}

interface Draft {
  name: string
  role: StaffRole
  phone: string
  shift: Shift
  availability: StaffAvailability
}

const blank: Draft = {
  name: '',
  role: 'Serving Staff',
  phone: '',
  shift: 'Evening',
  availability: 'Available',
}

/** Module 4 FE-4 to FE-6 — staff records, availability and allocation planning. */
export function StaffPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { allows } = useAuth()
  const canManage = allows('manage:staff')

  const staffQuery = useApi<StaffPayload>('/staff')
  const allocationQuery = useApi<AllocationPayload>('/staff/allocation')

  const rows = staffQuery.data?.staff ?? []
  const allocationPlan = allocationQuery.data?.shifts ?? []
  const [tab, setTab] = useState<'records' | 'availability' | 'allocation'>('records')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [shiftFilter, setShiftFilter] = useState('All shifts')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [removing, setRemoving] = useState<StaffMember | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(
      (s) =>
        (roleFilter === 'All roles' || s.role === roleFilter) &&
        (shiftFilter === 'All shifts' || s.shift === shiftFilter) &&
        (q === '' || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.id.toLowerCase().includes(q)),
    )
  }, [rows, search, roleFilter, shiftFilter])

  const counts = useMemo(
    () => ({
      total: rows.length,
      onShift: rows.filter((s) => s.availability === 'On Shift').length,
      available: rows.filter((s) => s.availability === 'Available').length,
      unavailable: rows.filter((s) => s.availability === 'On Leave' || s.availability === 'Off Duty').length,
    }),
    [rows],
  )

  const openCreate = () => {
    setEditing(null)
    setDraft(blank)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (s: StaffMember) => {
    setEditing(s)
    setDraft({ name: s.name, role: s.role, phone: s.phone, shift: s.shift, availability: s.availability })
    setErrors({})
    setFormOpen(true)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!draft.name.trim()) next.name = 'Staff name is required.'
    if (!draft.phone.trim()) next.phone = 'Phone number is required.'
    else if (draft.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number.'
    setErrors(next)
    if (Object.keys(next).length) return

    const body = {
      name: draft.name.trim(),
      role: draft.role,
      phone: draft.phone.trim(),
      shift: draft.shift,
      availability: draft.availability,
    }

    try {
      if (editing) {
        await api.patch(`/staff/${editing.id}`, body)
        push({ tone: 'success', title: 'Staff record updated', detail: body.name })
      } else {
        // The server allocates the next ST-nn code.
        await api.post('/staff', body)
        push({ tone: 'success', title: 'Staff member added', detail: body.name })
      }
      staffQuery.refresh()
      allocationQuery.refresh()
      setFormOpen(false)
    } catch (err) {
      setErrors({ name: messageOf(err) })
    }
  }

  const columns: Column<StaffMember>[] = [
    { key: 'id', header: 'Staff ID', render: (s) => s.id },
    {
      key: 'name',
      header: 'Name',
      className: 'font-semibold text-ink',
      render: (s) => s.name,
    },
    {
      key: 'role',
      header: 'Role',
      render: (s) => {
        const Icon = roleIcon[s.role]
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="size-[14px] text-brand-600" strokeWidth={2} />
            {s.role}
          </span>
        )
      },
    },
    { key: 'phone', header: 'Phone', render: (s) => s.phone },
    { key: 'shift', header: 'Shift', render: (s) => `${s.shift} · ${shiftHours[s.shift]}` },
    {
      key: 'availability',
      header: 'Availability',
      align: 'center',
      render: (s) => <Badge tone={availabilityTone[s.availability]}>{s.availability}</Badge>,
    },
    { key: 'joined', header: 'Joined', render: (s) => s.joined },
    ...(canManage
      ? [
          {
            key: 'action',
            header: 'Action',
            align: 'center' as const,
            className: 'w-[150px]',
            render: (s: StaffMember) => (
              <div className="flex items-center justify-center gap-1.5">
                <Button size="xs" variant="outline" leftIcon={<Pencil className="size-[11px]" />} onClick={() => openEdit(s)}>
                  Edit
                </Button>
                <Button
                  size="xs"
                  variant="outlineDanger"
                  leftIcon={<Trash2 className="size-[11px]" />}
                  onClick={() => setRemoving(s)}
                >
                  Remove
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader
        title="Staff Management"
        underline
        notificationCount={3}
        onToggleNav={toggle}
        action={
          canManage ? (
            <Button leftIcon={<Plus className="size-[15px]" />} onClick={openCreate}>
              Add Staff
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard variant="circleUp" color="#C99A3E" icon={<Users />} label="Total Staff" value={String(counts.total)} caption="Across all roles" />
          <StatCard variant="circleUp" color="#1B62B5" icon={<Clock />} label="On Shift Now" value={String(counts.onShift)} caption="Currently working" />
          <StatCard variant="circleUp" color="#2E7D32" icon={<CheckCircle2 />} label="Available" value={String(counts.available)} caption="Can be assigned" />
          <StatCard variant="circleUp" color="#E4572E" icon={<AlertTriangle />} label="Off Duty / On Leave" value={String(counts.unavailable)} caption="Not available today" />
        </section>

        <Card className="overflow-hidden">
          <Tabs
            className="px-2 pt-1"
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            items={[
              { id: 'records', label: 'Staff Records', count: rows.length },
              { id: 'availability', label: 'Availability by Shift' },
              { id: 'allocation', label: 'Allocation Planning' },
            ]}
          />

          {/* Module 4 FE-4 — staff records */}
          {tab === 'records' && (
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
                  <div>
                    <Label htmlFor="staff-search">Search</Label>
                    <Input
                      id="staff-search"
                      trailing={<Search />}
                      placeholder="Name, phone or ID"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="staff-role">Role</Label>
                    <Select
                      id="staff-role"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      options={['All roles', ...staffRoles].map((r) => ({ value: r, label: r }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="staff-shift">Shift</Label>
                    <Select
                      id="staff-shift"
                      value={shiftFilter}
                      onChange={(e) => setShiftFilter(e.target.value)}
                      options={['All shifts', ...shifts].map((r) => ({ value: r, label: r }))}
                    />
                  </div>
                </div>
                <p className="text-[12px] text-ink-muted">
                  Showing {filtered.length} of {rows.length} staff members
                </p>
              </div>

              <div className="mt-3.5 overflow-hidden rounded-[10px] border border-line">
                {filtered.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-6" strokeWidth={1.7} />}
                    title="No staff match these filters"
                    detail="Try a different role, shift or search term."
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSearch('')
                          setRoleFilter('All roles')
                          setShiftFilter('All shifts')
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <DataTable columns={columns} rows={filtered} rowKey={(s) => s.id} minWidth={960} />
                )}
              </div>
            </div>
          )}

          {/* Module 4 FE-5 — availability against expected customer flow */}
          {tab === 'availability' && (
            <div className="grid gap-4 p-4 lg:grid-cols-3">
              {shifts.map((shift) => {
                const inShift = rows.filter((s) => s.shift === shift)
                const plan = allocationPlan.find((a) => a.shift === shift)
                return (
                  <Card key={shift} className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[14px] font-bold text-ink">{shift}</h3>
                      <span className="text-[11px] text-ink-muted">{shiftHours[shift]}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] text-ink-muted">
                      {plan?.expectedGuests ?? 0} expected guests · {plan?.reservations ?? 0}{' '}
                      reservations
                    </p>

                    <ul className="mt-3.5 grid gap-2">
                      {staffRoles.map((role) => {
                        const list = inShift.filter((s) => s.role === role)
                        const ready = list.filter((s) => s.availability !== 'On Leave').length
                        const Icon = roleIcon[role]
                        return (
                          <li
                            key={role}
                            className="flex items-center gap-2.5 rounded-[9px] border border-line px-3 py-2.5"
                          >
                            <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                              <Icon className="size-[15px]" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">{role}</span>
                            <span className="shrink-0 text-[12px] font-bold text-ink">
                              {ready}
                              <span className="text-ink-faint">/{list.length}</span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Module 4 FE-6 — allocation planning against the prediction model */}
          {tab === 'allocation' && (
            <div className="p-4">
              <SectionTitle icon={<Users className="size-[16px]" strokeWidth={2.3} />}>
                Predicted requirement vs rostered staff
              </SectionTitle>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Requirement is derived from guests held in each shift&apos;s slots at{' '}
                {allocationQuery.data?.ratios.guestsPerChef ?? 30} guests per chef and{' '}
                {allocationQuery.data?.ratios.guestsPerServer ?? 20} per server, set in Settings.
              </p>

              <div className="mt-3.5 grid gap-3">
                {allocationPlan.map((plan) => {
                  const rostered = rows.filter((s) => s.shift === plan.shift && s.availability !== 'On Leave')
                  const rows2 = [
                    { role: 'Chef' as StaffRole, required: plan.requiredChefs },
                    { role: 'Serving Staff' as StaffRole, required: plan.requiredServing },
                    { role: 'Cleaning Staff' as StaffRole, required: plan.requiredCleaning },
                  ]
                  return (
                    <Card key={plan.shift} className="p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-[13.5px] font-bold text-ink">
                          {plan.shift} shift
                          <span className="ml-2 text-[11px] font-normal text-ink-muted">
                            {shiftHours[plan.shift]}
                          </span>
                        </h3>
                        <p className="text-[11.5px] text-ink-muted">
                          {plan.expectedGuests} expected guests · {plan.reservations} reservations
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                        {rows2.map(({ role, required }) => {
                          const have = rostered.filter((s) => s.role === role).length
                          const gap = required - have
                          const Icon = roleIcon[role]
                          return (
                            <div
                              key={role}
                              className={cn(
                                'rounded-[10px] border px-3 py-3',
                                gap > 0 ? 'border-state-danger/25 bg-state-dangerBg' : 'border-line bg-[#FBF9F7]',
                              )}
                            >
                              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
                                <Icon className="size-[14px]" strokeWidth={2} />
                                {role}
                              </p>
                              <p className="mt-1.5 text-[18px] font-extrabold leading-none text-ink">
                                {have}
                                <span className="text-[13px] font-semibold text-ink-muted"> / {required}</span>
                              </p>
                              <p
                                className={cn(
                                  'mt-1.5 text-[11px] font-semibold',
                                  gap > 0 ? 'text-state-danger' : 'text-state-success',
                                )}
                              >
                                {gap > 0 ? `Add ${gap} more` : 'Fully covered'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add / edit staff */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Staff Member'}
        subtitle="Staff records feed the allocation planner and the prediction model."
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="staff-form">
              {editing ? 'Save changes' : 'Add staff member'}
            </Button>
          </>
        }
      >
        <form id="staff-form" noValidate onSubmit={save} className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="sf-name" required>
              Full name
            </Label>
            <Input
              id="sf-name"
              icon={<User />}
              value={draft.name}
              error={errors.name}
              onChange={(e) => {
                setDraft((d) => ({ ...d, name: e.target.value }))
                setErrors((x) => ({ ...x, name: undefined }))
              }}
              placeholder="e.g. Imran Yousaf"
            />
            <FieldError>{errors.name}</FieldError>
          </div>

          <div>
            <Label htmlFor="sf-role" required>
              Role
            </Label>
            <Select
              id="sf-role"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as StaffRole }))}
              options={staffRoles.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div>
            <Label htmlFor="sf-phone" required>
              Phone
            </Label>
            <Input
              id="sf-phone"
              icon={<Phone />}
              value={draft.phone}
              error={errors.phone}
              onChange={(e) => {
                setDraft((d) => ({ ...d, phone: e.target.value }))
                setErrors((x) => ({ ...x, phone: undefined }))
              }}
              placeholder="+92 300 000 0000"
            />
            <FieldError>{errors.phone}</FieldError>
          </div>

          <div>
            <Label htmlFor="sf-shift" required>
              Shift
            </Label>
            <Select
              id="sf-shift"
              value={draft.shift}
              onChange={(e) => setDraft((d) => ({ ...d, shift: e.target.value as Shift }))}
              options={shifts.map((s) => ({ value: s, label: `${s} · ${shiftHours[s]}` }))}
            />
          </div>

          <div>
            <Label htmlFor="sf-avail" required>
              Availability
            </Label>
            <Select
              id="sf-avail"
              value={draft.availability}
              onChange={(e) => setDraft((d) => ({ ...d, availability: e.target.value as StaffAvailability }))}
              options={availabilities.map((s) => ({ value: s, label: s }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Remove this staff member?"
        message={`${removing?.name ?? ''} will be removed from the roster and excluded from allocation planning.`}
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            try {
              await api.del(`/staff/${removing.id}`)
              push({ tone: 'info', title: 'Staff member removed', detail: removing.name })
              staffQuery.refresh()
              allocationQuery.refresh()
            } catch (err) {
              push({ tone: 'error', title: 'Staff member not removed', detail: messageOf(err) })
            }
          }
          setRemoving(null)
        }}
      />
    </>
  )
}

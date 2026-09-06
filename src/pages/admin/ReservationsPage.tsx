import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Eye,
  History,
  ListChecks,
  RotateCcw,
  Search,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Input, Label, Select } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FilterIcon } from '@/components/icons/FilterIcon'
import { StatusBadge } from '@/components/reservation/StatusTimeline'
import { ReservationFormModal } from '@/components/reservation/ReservationFormModal'
import { useReservations } from '@/store/ReservationsContext'
import { useAuth } from '@/auth/AuthContext'
import {
  activeStatuses,
  historyStatuses,
  matchesPartySize,
  reservationFilters,
  type Reservation,
} from '@/data/reservations'
import { formatBookingDate } from '@/lib/date'
import { useApi } from '@/lib/useApi'

interface StatsPayload {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  guests: number
}

interface UpcomingPayload {
  bookings: { id: string; time: string; name: string; guests: number; table: string }[]
}

const statIcons = [CalendarDays, Clock, CheckCircle2, XCircle, UsersRound]

const emptyFilters = {
  status: 'All Statuses',
  occasion: 'All Occasions',
  timeSlot: 'All Time Slots',
  source: 'All Sources',
  party: 'Any party size',
}

export function ReservationsPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { allows } = useAuth()
  const { reservations, setStatus } = useReservations()

  // Counters and the next-up list are computed by the server across every
  // booking, not just the page of rows currently loaded.
  const statsQuery = useApi<StatsPayload>('/reservations/stats')
  const upcomingQuery = useApi<UpcomingPayload>('/reservations/upcoming')

  const c = statsQuery.data
  const reservationStats = [
    { key: 'total', label: 'Total Reservations', value: (c?.total ?? 0).toLocaleString('en-PK'), caption: 'All statuses' },
    { key: 'pending', label: 'Pending Reservations', value: (c?.pending ?? 0).toLocaleString('en-PK'), caption: 'Awaiting approval' },
    { key: 'confirmed', label: 'Confirmed Reservations', value: (c?.confirmed ?? 0).toLocaleString('en-PK'), caption: 'Table assigned' },
    { key: 'cancelled', label: 'Cancelled Reservations', value: (c?.cancelled ?? 0).toLocaleString('en-PK'), caption: 'Released their table' },
    { key: 'guests', label: 'Guests Expected', value: (c?.guests ?? 0).toLocaleString('en-PK'), caption: 'Across live bookings' },
  ]

  const upcomingBookings = upcomingQuery.data?.bookings ?? []

  const canManage = allows('manage:reservations')

  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [confirmReject, setConfirmReject] = useState<Reservation | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<Reservation | null>(null)

  const scoped = useMemo(
    () =>
      reservations.filter((r) =>
        tab === 'active' ? activeStatuses.includes(r.status) : historyStatuses.includes(r.status),
      ),
    [reservations, tab],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scoped.filter(
      (r) =>
        (applied.status === 'All Statuses' || r.status === applied.status) &&
        (applied.occasion === 'All Occasions' || r.occasion === applied.occasion) &&
        (applied.timeSlot === 'All Time Slots' || r.timeSlot === applied.timeSlot) &&
        (applied.source === 'All Sources' || r.source === applied.source) &&
        matchesPartySize(r.guests, applied.party) &&
        (q === '' ||
          r.customerName.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.table.toLowerCase().includes(q)),
    )
  }, [scoped, applied, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * rowsPerPage, current * rowsPerPage)
  const filtersDirty = JSON.stringify(applied) !== JSON.stringify(emptyFilters) || search !== ''

  const act = (r: Reservation, status: Reservation['status'], note: string, message: string) => {
    setStatus(r.id, status, note)
    push({ tone: status === 'Confirmed' ? 'success' : 'info', title: message, detail: r.reference })
  }

  const columns: Column<Reservation>[] = [
    {
      key: 'name',
      header: 'Customer Name',
      className: 'font-medium text-ink',
      render: (r) => (
        <Link to={`/admin/reservations/${r.id}`} className="hover:text-brand-700 hover:underline">
          {r.customerName}
        </Link>
      ),
    },
    { key: 'phone', header: 'Phone Number', render: (r) => r.phone },
    { key: 'date', header: 'Date', render: (r) => formatBookingDate(r.date) },
    { key: 'slot', header: 'Time Slot', render: (r) => r.timeSlot },
    { key: 'guests', header: 'Guests', align: 'center', render: (r) => r.guests },
    { key: 'occasion', header: 'Occasion Type', render: (r) => r.occasion },
    { key: 'table', header: 'Selected Table', align: 'center', render: (r) => r.table },
    { key: 'request', header: 'Special Request', render: (r) => r.specialRequest || '—' },
    { key: 'source', header: 'Booking Source', render: (r) => r.source },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[176px]',
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          {canManage && r.status === 'Pending' && (
            <>
              <Button
                size="xs"
                variant="success"
                onClick={() =>
                  act(r, 'Confirmed', 'Table assigned and confirmation sent.', 'Reservation confirmed')
                }
              >
                Confirm
              </Button>
              <Button size="xs" variant="primary" onClick={() => setConfirmReject(r)}>
                Reject
              </Button>
            </>
          )}

          {canManage && (r.status === 'Confirmed' || r.status === 'Updated') && (
            <>
              <Button size="xs" variant="primary" onClick={() => setEditing(r)}>
                Update
              </Button>
              <Button size="xs" variant="outline" onClick={() => setConfirmCancel(r)}>
                Cancel
              </Button>
            </>
          )}

          {historyStatuses.includes(r.status) && r.status === 'Completed' && canManage && (
            <Button
              size="xs"
              variant="outlineNeutral"
              onClick={() => push({ tone: 'success', title: 'Reminder sent', detail: r.customerName })}
            >
              Send Reminder
            </Button>
          )}

          <Link
            to={`/admin/reservations/${r.id}`}
            aria-label={`Open ${r.customerName}'s reservation`}
            className="focus-ring rounded p-1 text-ink-faint transition hover:text-ink"
          >
            <Eye className="size-[15px]" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Admin Reservation Management"
        onToggleNav={toggle}
        action={
          canManage ? (
            <Button
              leftIcon={<CalendarPlus className="size-[15px]" />}
              onClick={() => setFormOpen(true)}
            >
              Add Reservation
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {reservationStats.map((s, i) => {
            const Icon = statIcons[i]
            return (
              <StatCard
                key={s.key}
                icon={<Icon />}
                label={s.label}
                value={s.value}
                caption={s.caption}
              />
            )
          })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_252px]">
          <div className="grid min-w-0 gap-4">
            {/* Filter bar */}
            <Card className="p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.5fr_repeat(4,1fr)]">
                <div>
                  <Label>Date Range</Label>
                  <Select
                    icon={<CalendarDays />}
                    value="May 20, 2025 - May 26, 2025"
                    onChange={() => {}}
                    options={[
                      { value: 'May 20, 2025 - May 26, 2025', label: 'May 20, 2025 - May 26, 2025' },
                      { value: 'May 27, 2025 - Jun 02, 2025', label: 'May 27, 2025 - Jun 02, 2025' },
                    ]}
                  />
                </div>
                <FilterSelect
                  label="Reservation Status"
                  value={draft.status}
                  options={reservationFilters.statuses}
                  onChange={(v) => setDraft((d) => ({ ...d, status: v }))}
                />
                <FilterSelect
                  label="Occasion Type"
                  value={draft.occasion}
                  options={reservationFilters.occasions}
                  onChange={(v) => setDraft((d) => ({ ...d, occasion: v }))}
                />
                <FilterSelect
                  label="Time Slot"
                  value={draft.timeSlot}
                  options={reservationFilters.timeSlots}
                  onChange={(v) => setDraft((d) => ({ ...d, timeSlot: v }))}
                />
                <FilterSelect
                  label="Booking Source"
                  value={draft.source}
                  options={reservationFilters.sources}
                  onChange={(v) => setDraft((d) => ({ ...d, source: v }))}
                />
              </div>

              {/* Module 2 FE-3 — free-text search plus a party-size bucket. */}
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
                  <div>
                    <Label htmlFor="res-search">Search</Label>
                    <Input
                      id="res-search"
                      trailing={<Search />}
                      placeholder="Name, phone, email, reference…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                  <FilterSelect
                    label="Number of Guests"
                    value={draft.party}
                    options={reservationFilters.partySizes}
                    onChange={(v) => setDraft((d) => ({ ...d, party: v }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    leftIcon={<FilterIcon className="size-[13px]" />}
                    onClick={() => {
                      setApplied(draft)
                      setPage(1)
                    }}
                  >
                    Filter
                  </Button>
                  <Button
                    size="sm"
                    variant="outlineNeutral"
                    leftIcon={<RotateCcw className="size-[13px]" />}
                    onClick={() => {
                      setDraft(emptyFilters)
                      setApplied(emptyFilters)
                      setSearch('')
                      setPage(1)
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>

            {/* Reservations table */}
            <Card className="overflow-hidden">
              <Tabs
                className="px-2 pt-1"
                value={tab}
                onChange={(id) => {
                  setTab(id as 'active' | 'history')
                  setPage(1)
                }}
                items={[
                  {
                    id: 'active',
                    label: 'Active bookings',
                    icon: <ListChecks className="size-[14px]" />,
                    count: reservations.filter((r) => activeStatuses.includes(r.status)).length,
                  },
                  {
                    id: 'history',
                    label: 'Reservation history',
                    icon: <History className="size-[14px]" />,
                    count: reservations.filter((r) => historyStatuses.includes(r.status)).length,
                  },
                ]}
              />

              {visible.length === 0 ? (
                <EmptyState
                  title={filtersDirty ? 'No reservations match these filters' : 'No reservations to show'}
                  detail={
                    filtersDirty
                      ? 'Try widening the date range, clearing the search box or resetting the filters.'
                      : tab === 'active'
                        ? 'New booking requests appear here as soon as customers submit them.'
                        : 'Completed, cancelled and rejected bookings are archived here.'
                  }
                  action={
                    filtersDirty ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDraft(emptyFilters)
                          setApplied(emptyFilters)
                          setSearch('')
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    rows={visible}
                    rowKey={(r) => r.id}
                    minWidth={1020}
                    // Page two starts at 11, not back at 1.
                    startIndex={(current - 1) * rowsPerPage}
                  />
                  <div className="border-t border-line">
                    <Pagination
                      page={current}
                      pageCount={pageCount}
                      onPage={setPage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPage={(n) => {
                        setRowsPerPage(n)
                        setPage(1)
                      }}
                      summary={`Showing ${(current - 1) * rowsPerPage + 1} to ${Math.min(
                        current * rowsPerPage,
                        filtered.length,
                      )} of ${filtered.length} reservations`}
                    />
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Upcoming bookings rail */}
          <Card className="flex h-fit flex-col overflow-hidden">
            <div className="px-4 pb-3 pt-4">
              <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                <CalendarDays className="size-[17px] text-[#D9932B]" strokeWidth={2} />
                Upcoming Bookings
              </h2>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">Today&apos;s Next Reservations</p>
            </div>

            <ul className="border-t border-line">
              {upcomingBookings.length === 0 && (
                <li className="px-4 py-5 text-center text-[12px] text-ink-muted">
                  No upcoming bookings.
                </li>
              )}
              {upcomingBookings.map((b) => (
                <li key={b.id} className="flex gap-3 border-b border-line-soft px-4 py-3">
                  <span className="w-[54px] shrink-0 pt-0.5 text-[12px] font-bold text-brand-600">
                    {b.time}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ink">{b.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                      <Users className="size-[12px]" /> {b.guests} Guests
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                      <TableIcon className="size-[12px]" /> Table {b.table}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-3">
              <Button
                variant="outline"
                size="sm"
                block
                rightIcon={<ArrowRight className="size-[14px]" />}
                onClick={() => {
                  setTab('active')
                  setDraft(emptyFilters)
                  setApplied(emptyFilters)
                  setSearch('')
                  setPage(1)
                }}
              >
                View All Reservations
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ReservationFormModal
        open={formOpen || editing !== null}
        reservation={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSaved={(message) => push({ tone: 'success', title: message })}
      />

      <ConfirmDialog
        open={confirmReject !== null}
        title="Reject this reservation?"
        message={`${confirmReject?.customerName ?? ''} will be notified that ${confirmReject?.reference ?? ''} could not be accommodated. The booking moves to your history.`}
        confirmLabel="Reject booking"
        onCancel={() => setConfirmReject(null)}
        onConfirm={() => {
          if (confirmReject)
            act(
              confirmReject,
              'Rejected',
              'No table available for the requested slot.',
              'Reservation rejected',
            )
          setConfirmReject(null)
        }}
      />

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Cancel this reservation?"
        message={`${confirmCancel?.customerName ?? ''} will receive a cancellation message for ${confirmCancel?.reference ?? ''} and the table will be released.`}
        confirmLabel="Cancel booking"
        onCancel={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel)
            act(confirmCancel, 'Cancelled', 'Cancelled by the restaurant.', 'Reservation cancelled')
          setConfirmCancel(null)
        }}
      />
    </>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options.map((o) => ({ value: o, label: o }))}
      />
    </div>
  )
}

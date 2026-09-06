import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { TableIcon } from '@/components/icons/TableIcon'
import { TableFormModal } from '@/components/table/TableFormModal'
import { AvailabilityChecker } from '@/components/table/AvailabilityChecker'
import { useAuth } from '@/auth/AuthContext'
import {
  EntranceSign,
  FloorPlan,
  Plant,
  Wall,
} from '@/components/floorplan/FloorPlan'
import { TimeSlotModule } from './TimeSlotModule'
import { type FloorTable, type TableType } from '@/data/tables'
import { api, messageOf } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface TablesPayload {
  tables: (FloorTable & { recordId: string })[]
}

interface TableStatsPayload {
  total: number
  available: number
  reserved: number
  blocked: number
  activeSlots: number
  captions: { available: string; reserved: string; blocked: string }
}

interface PeakPayload {
  peakHours: { slot: string; booked: number; capacity: number; load: number; label: string }[]
}

const typeFilters: (TableType | 'All')[] = ['All', 'Couple', 'Family', 'Group', 'Private']
const filterIcons = { All: null, Couple: Users, Family: Users, Group: Users, Private: Lock }

/** Free slots on the floor plan for newly added tables. */
const spareSlots = [
  { x: 12, y: 21, w: 11, h: 30 },
  { x: 28, y: 21, w: 12, h: 30 },
  { x: 45.5, y: 21, w: 12, h: 30 },
  { x: 68, y: 21, w: 12, h: 30 },
  { x: 12, y: 62, w: 11, h: 30 },
  { x: 28, y: 62, w: 12, h: 30 },
  { x: 45.5, y: 62, w: 12, h: 30 },
  { x: 68, y: 62, w: 12, h: 30 },
  { x: 84, y: 21, w: 11, h: 30 },
  { x: 84, y: 62, w: 11, h: 30 },
]

export function TableManagementPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { allows } = useAuth()
  const canManage = allows('manage:tables')

  const tablesQuery = useApi<TablesPayload>('/tables')
  const statsQuery = useApi<TableStatsPayload>('/tables/stats')
  const peaksQuery = useApi<PeakPayload>('/dashboard/peak-hours')

  const allTables = tablesQuery.data?.tables ?? []
  const [typeFilter, setTypeFilter] = useState<TableType | 'All'>('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | undefined>()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FloorTable | null>(null)
  const [removing, setRemoving] = useState<FloorTable | null>(null)

  const tables = useMemo(
    () =>
      allTables.filter(
        (t) =>
          (typeFilter === 'All' || t.type === typeFilter) &&
          (search.trim() === '' || t.id.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [allTables, typeFilter, search],
  )

  const selectedTable = allTables.find((t) => t.id === selected)

  // Module 3 FE-6 — the KPI row is counted by the server across every table,
  // not just the ones matching the current filter.
  const s = statsQuery.data
  const stats = [
    { key: 'total', label: 'Total Tables', value: String(s?.total ?? 0), caption: 'All tables in restaurant', color: '#C99A3E' },
    { key: 'available', label: 'Available Tables', value: String(s?.available ?? 0), caption: s?.captions.available ?? '—', color: '#2E7D32' },
    { key: 'reserved', label: 'Reserved Tables', value: String(s?.reserved ?? 0), caption: s?.captions.reserved ?? '—', color: '#1B62B5' },
    { key: 'blocked', label: 'Blocked Tables', value: String(s?.blocked ?? 0), caption: s?.captions.blocked ?? '—', color: '#E4572E' },
    { key: 'slots', label: 'Active Time Slots', value: String(s?.activeSlots ?? 0), caption: 'Open for booking', color: '#7B3FBF' },
  ]

  const reload = () => {
    tablesQuery.refresh()
    statsQuery.refresh()
    peaksQuery.refresh()
  }

  /** Live equivalents of the old static side panels. */
  const peaks = peaksQuery.data?.peakHours ?? []
  const busiest = peaks.reduce<(typeof peaks)[number] | null>(
    (best, p) => (!best || p.load > best.load ? p : best),
    null,
  )
  const quickSummary = [
    { label: 'Peak reservation slot', value: busiest?.slot ?? '—', icon: 'clock' as const },
    { label: 'Tables blocked today', value: String(s?.blocked ?? 0), icon: 'lock' as const },
    {
      label: 'Available family tables',
      value: String(allTables.filter((t) => t.type === 'Family' && t.status === 'Available').length),
      icon: 'users' as const,
    },
    {
      label: 'Next fully booked slot',
      value: peaks.find((p) => p.load >= 90)?.slot ?? 'None',
      icon: 'clock' as const,
    },
  ]

  const slotAlerts = [
    ...peaks
      .filter((p) => p.load >= 70)
      .slice(0, 2)
      .map((p) => ({
        tone: p.load >= 90 ? ('danger' as const) : ('warn' as const),
        title: `${p.slot} is ${p.load}% booked`,
        detail: `${Math.max(0, p.capacity - p.booked)} table(s) left`,
        time: 'Now',
      })),
    ...allTables
      .filter((t) => t.status === 'Blocked')
      .slice(0, 1)
      .map((t) => ({
        tone: 'danger' as const,
        title: `Table ${t.id} blocked`,
        detail: 'Not offered to guests',
        time: 'Now',
      })),
    {
      tone: 'success' as const,
      title: `${allTables.filter((t) => t.type === 'Family' && t.status === 'Available').length} family tables available`,
      detail: 'Across all open slots',
      time: 'Now',
    },
  ]

  const saveTable = async (draft: Omit<FloorTable, 'x' | 'y' | 'w' | 'h'>, isEdit: boolean) => {
    const body = {
      code: draft.id,
      seats: draft.seats,
      type: draft.type,
      section: draft.section,
      shape: draft.shape,
      status: draft.status,
    }

    try {
      if (isEdit && editing) {
        await api.patch(`/tables/${editing.id}`, body)
        setSelected(draft.id)
        push({ tone: 'success', title: `Table ${draft.id} updated` })
      } else {
        const slot = spareSlots[allTables.length % spareSlots.length]
        await api.post('/tables', { ...body, ...slot })
        push({
          tone: 'success',
          title: `Table ${draft.id} added`,
          detail: `${draft.seats} seats · ${draft.section}`,
        })
      }
      reload()
    } catch (err) {
      push({ tone: 'error', title: 'Table not saved', detail: messageOf(err) })
    }
  }

  const blockTable = async () => {
    if (!selectedTable) return
    const next = selectedTable.status === 'Blocked' ? 'Available' : 'Blocked'
    try {
      await api.patch(`/tables/${selectedTable.id}`, { status: next })
      push({
        tone: next === 'Blocked' ? 'warning' : 'success',
        title: `Table ${selectedTable.id} ${next === 'Blocked' ? 'blocked' : 'unblocked'}`,
      })
      reload()
    } catch (err) {
      // The server refuses to block a table that still holds live bookings.
      push({ tone: 'error', title: `Table ${selectedTable.id} not changed`, detail: messageOf(err) })
    }
  }

  return (
    <>
      <PageHeader
        title="Table and Time Slot Management Module"
        accentPrefix={2}
        banner
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((s, i) => (
            <StatCard
              key={s.key}
              variant="circleUp"
              color={s.color}
              icon={[<TableIcon key="a" />, <TableIcon key="b" />, <TableIcon key="c" />, <Lock key="d" />, <Clock key="e" />][i]}
              label={s.label}
              value={s.value}
              caption={s.caption}
            />
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="grid min-w-0 gap-4">
            {/* 1. Table management */}
            <Card className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SectionTitle uppercase icon={<TableIcon className="size-[17px]" strokeWidth={2.2} />}>
                  1. Table Management
                </SectionTitle>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search table..."
                  aria-label="Search table"
                  trailing={<Search />}
                  className="h-[34px] lg:w-[240px]"
                />
              </div>

              <div className="mt-3.5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="whitespace-nowrap text-[12px] font-bold text-ink">Table Type Filter:</span>
                  {typeFilters.map((t) => {
                    const Icon = filterIcons[t]
                    const active = typeFilter === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        className={cn(
                          'focus-ring inline-flex h-[30px] items-center gap-1.5 rounded-[7px] border px-2.5 text-xs font-semibold transition',
                          active
                            ? 'brand-fill border-brand-800 text-white'
                            : 'border-line bg-white text-ink-soft hover:bg-line-soft',
                        )}
                      >
                        {Icon && <Icon className="size-[13px]" />}
                        {t}
                      </button>
                    )
                  })}
                </div>

                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      leftIcon={<Plus className="size-[14px]" />}
                      onClick={() => {
                        setEditing(null)
                        setFormOpen(true)
                      }}
                    >
                      Add Table
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Pencil className="size-[13px]" />}
                      disabled={!selectedTable}
                      onClick={() => {
                        setEditing(selectedTable ?? null)
                        setFormOpen(true)
                      }}
                    >
                      Edit Table
                    </Button>
                    <Button
                      size="sm"
                      variant="outlineDanger"
                      leftIcon={<Trash2 className="size-[13px]" />}
                      disabled={!selectedTable}
                      onClick={() => setRemoving(selectedTable ?? null)}
                    >
                      Delete Table
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Lock className="size-[13px]" />}
                      disabled={!selectedTable}
                      onClick={blockTable}
                    >
                      {selectedTable?.status === 'Blocked' ? 'Unblock Table' : 'Block Table'}
                    </Button>
                  </div>
                )}
              </div>

              {selectedTable && (
                <p className="mt-3 rounded-[9px] border border-line bg-[#FBF9F7] px-3 py-2 text-[11.5px] text-ink-soft">
                  <span className="font-bold text-ink">Table {selectedTable.id}</span> ·{' '}
                  {selectedTable.seats} seats · {selectedTable.type} · {selectedTable.section} ·{' '}
                  {selectedTable.status}
                </p>
              )}

              <div className="mt-3.5">
                {tables.length === 0 ? (
                  <EmptyState
                    icon={<TableIcon className="size-6" strokeWidth={1.7} />}
                    title="No tables match this filter"
                    detail="Try a different table type, or clear the search box."
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSearch('')
                          setTypeFilter('All')
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                <FloorPlan
                  variant="admin"
                  tables={tables}
                  selectedId={selected}
                  onSelect={(t) => setSelected((prev) => (prev === t.id ? undefined : t.id))}
                  aspect="38%"
                >
                  <EntranceSign left="2.5%" top="38%" />
                  <Wall style={{ left: '62%', top: '8%', width: '0.8%', height: '26%' }} />
                  <Wall style={{ left: '62%', top: '8%', width: '6%', height: '3%' }} />
                  <Plant style={{ left: '1.5%', top: '6%' }} size={26} />
                  <Plant style={{ left: '1.5%', bottom: '4%' }} size={26} />
                  <Plant style={{ right: '1.5%', top: '10%' }} size={26} />
                  <Plant style={{ right: '1.5%', bottom: '6%' }} size={26} />
                  <Plant style={{ left: '46%', bottom: '2%' }} size={22} />
                  <Plant style={{ left: '67%', bottom: '2%' }} size={22} />
                </FloorPlan>
                )}
              </div>
            </Card>

            {/* Module 3 FE-4/FE-5 — availability + double-booking check */}
            <AvailabilityChecker tables={allTables} />

            {/* 2. Time slot management */}
            <TimeSlotModule />
          </div>

          {/* Right rail */}
          <div className="grid h-fit gap-4">
            <Card className="p-4">
              <SectionTitle uppercase icon={<BarChart3 className="size-[16px] text-gold-500" strokeWidth={2.4} />}>
                Quick Summary
              </SectionTitle>

              <ul className="mt-3 divide-y divide-line-soft rounded-[10px] border border-line">
                {quickSummary.map((row) => (
                  <li key={row.label} className="flex items-center gap-2.5 px-3 py-3">
                    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-gold-50 text-gold-400">
                      {row.icon === 'clock' && <Clock className="size-[14px]" />}
                      {row.icon === 'lock' && <Lock className="size-[14px]" />}
                      {row.icon === 'users' && <Users className="size-[14px]" />}
                    </span>
                    <span className="min-w-0 flex-1 text-[12px] text-ink-soft">{row.label}</span>
                    <span className="shrink-0 whitespace-nowrap text-[11.5px] font-bold text-brand-700">
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <SectionTitle uppercase icon={<Bell className="size-[16px] text-gold-500" strokeWidth={2.4} />}>
                Slot Alerts
              </SectionTitle>

              <ul className="mt-3 grid gap-2">
                {slotAlerts.map((a) => (
                  <li key={a.title} className="flex gap-2.5 rounded-[9px] border border-line px-3 py-2.5">
                    <span className="mt-0.5 shrink-0">
                      {a.tone === 'warn' && <AlertTriangle className="size-[17px] fill-[#F5A623] text-white" />}
                      {a.tone === 'danger' && (
                        <span className="flex size-[17px] items-center justify-center rounded-[4px] bg-[#C0392B]">
                          <Lock className="size-[11px] text-white" strokeWidth={2.6} />
                        </span>
                      )}
                      {a.tone === 'success' && <CheckCircle2 className="size-[17px] fill-[#1E9E52] text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold leading-snug text-ink">{a.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{a.detail}</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-[10px] text-ink-faint">{a.time}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-center">
                <Button size="sm" variant="outline">
                  View All Alerts
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <TableFormModal
        open={formOpen}
        table={editing}
        existingIds={allTables.map((t) => t.id)}
        onClose={() => setFormOpen(false)}
        onSave={saveTable}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Delete this table?"
        message={`Table ${removing?.id ?? ''} will be removed from the floor plan and can no longer be booked.`}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            try {
              await api.del(`/tables/${removing.id}`)
              if (selected === removing.id) setSelected(undefined)
              push({ tone: 'info', title: `Table ${removing.id} deleted` })
              reload()
            } catch (err) {
              // A table holding live bookings cannot be deleted.
              push({ tone: 'error', title: 'Table not deleted', detail: messageOf(err) })
            }
          }
          setRemoving(null)
        }}
      />
    </>
  )
}

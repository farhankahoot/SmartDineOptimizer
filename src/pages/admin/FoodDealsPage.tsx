import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  Bell,
  Cake,
  Check,
  ChevronDown,
  ChevronRight,
  Pause,
  Pencil,
  Play,
  Plus,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import {
  dealCategories,
  dealOccasions,
  dealPerformance,
  dealStats,
  deals,
  type Deal,
} from '@/data/deals'
import { requestAlerts, specialRequests, type RequestStatus, type SpecialRequest } from '@/data/requests'

const statIcons = [Tag, Cake, Users, Bell]

const requestTone: Record<RequestStatus, BadgeTone> = {
  Pending: 'pending',
  'In Progress': 'inProgress',
  Accepted: 'accepted',
  Completed: 'confirmed',
}

interface DealDraft {
  name: string
  category: string
  occasion: string
  price: string
  items: string
  active: boolean
}

const blankDeal: DealDraft = {
  name: '',
  category: dealCategories[0],
  occasion: dealOccasions[0],
  price: '',
  items: '',
  active: true,
}

export function FoodDealsPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { allows } = useAuth()
  const canManageDeals = allows('manage:deals')

  const [dealRows, setDealRows] = useState(deals)
  const [requestRows, setRequestRows] = useState(specialRequests)
  const [detail, setDetail] = useState<SpecialRequest | null>(null)

  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [dealDraft, setDealDraft] = useState<DealDraft>(blankDeal)
  const [dealErrors, setDealErrors] = useState<Partial<Record<keyof DealDraft, string>>>({})
  const [removingDeal, setRemovingDeal] = useState<Deal | null>(null)
  const [rejecting, setRejecting] = useState<SpecialRequest | null>(null)

  const toggleDeal = (deal: Deal) => {
    setDealRows((prev) => prev.map((d) => (d.id === deal.id ? { ...d, active: !d.active } : d)))
    push({
      tone: deal.active ? 'info' : 'success',
      title: `${deal.name} ${deal.active ? 'deactivated' : 'activated'}`,
    })
  }

  const setRequestStatus = (id: string, status: RequestStatus, message: string) => {
    setRequestRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    push({ tone: 'success', title: message })
  }

  const openCreateDeal = () => {
    setEditingDeal(null)
    setDealDraft(blankDeal)
    setDealErrors({})
    setDealFormOpen(true)
  }

  const openEditDeal = (d: Deal) => {
    setEditingDeal(d)
    setDealDraft({
      name: d.name,
      category: d.category,
      occasion: d.occasion,
      price: d.price.replace(/[^\d]/g, ''),
      items: d.items,
      active: d.active,
    })
    setDealErrors({})
    setDealFormOpen(true)
  }

  const saveDeal = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof dealErrors = {}
    if (!dealDraft.name.trim()) next.name = 'Deal name is required.'
    else if (
      dealRows.some(
        (d) => d.id !== editingDeal?.id && d.name.toLowerCase() === dealDraft.name.trim().toLowerCase(),
      )
    )
      next.name = 'A deal with this name already exists.'

    const price = Number(dealDraft.price)
    if (!dealDraft.price.trim()) next.price = 'Price is required.'
    else if (Number.isNaN(price) || price <= 0) next.price = 'Enter a valid price.'

    if (!dealDraft.items.trim()) next.items = 'List at least one included item.'

    setDealErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      name: dealDraft.name.trim(),
      category: dealDraft.category,
      occasion: dealDraft.occasion,
      price: `\u20A8${price.toLocaleString('en-IN')}`,
      items: dealDraft.items.trim(),
      active: dealDraft.active,
    }

    if (editingDeal) {
      setDealRows((prev) => prev.map((d) => (d.id === editingDeal.id ? { ...d, ...payload } : d)))
      push({ tone: 'success', title: 'Deal updated', detail: payload.name })
    } else {
      setDealRows((prev) => [...prev, { id: `D${prev.length + 1}`, ...payload }])
      push({ tone: 'success', title: 'Deal created', detail: payload.name })
    }
    setDealFormOpen(false)
  }

  const dealColumns: Column<Deal>[] = [
    { key: 'name', header: 'Deal Name', className: 'font-semibold text-ink', render: (d) => d.name },
    { key: 'category', header: 'Deal Category', align: 'center', render: (d) => d.category },
    { key: 'occasion', header: 'Occasion Type', align: 'center', render: (d) => d.occasion },
    { key: 'price', header: 'Price', align: 'center', render: (d) => d.price },
    {
      key: 'items',
      header: 'Included Items',
      className: 'w-[210px] min-w-[190px]',
      wrap: true,
      render: (d) => d.items,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (d) => <Badge tone={d.active ? 'active' : 'inactive'}>{d.active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[250px]',
      render: (d) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button size="xs" leftIcon={<Pencil className="size-[11px]" />} onClick={() => openEditDeal(d)}>
            Edit
          </Button>
          {d.active ? (
            <Button
              size="xs"
              variant="outlineNeutral"
              leftIcon={<Pause className="size-[11px]" />}
              onClick={() => toggleDeal(d)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="xs"
              variant="outlineSuccess"
              leftIcon={<Play className="size-[11px]" />}
              onClick={() => toggleDeal(d)}
            >
              Activate
            </Button>
          )}
          <Button
            size="xs"
            variant="outlineDanger"
            leftIcon={<Trash2 className="size-[11px]" />}
            onClick={() => setRemovingDeal(d)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const requestColumns: Column<SpecialRequest>[] = [
    { key: 'name', header: 'Customer Name', className: 'font-semibold text-ink', render: (r) => r.customerName },
    { key: 'res', header: 'Reservation ID', align: 'center', render: (r) => r.reservationId },
    { key: 'date', header: 'Date', align: 'center', render: (r) => r.date },
    { key: 'slot', header: 'Time Slot', align: 'center', render: (r) => r.timeSlot },
    { key: 'table', header: 'Selected Table', align: 'center', render: (r) => r.table },
    { key: 'occasion', header: 'Occasion Type', align: 'center', render: (r) => r.occasion },
    {
      key: 'request',
      header: 'Special Request',
      className: 'w-[150px] min-w-[140px]',
      wrap: true,
      render: (r) => r.request,
    },
    {
      key: 'status',
      header: 'Request Status',
      align: 'center',
      render: (r) => <Badge tone={requestTone[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'details',
      header: '',
      align: 'center',
      className: 'w-[130px]',
      render: (r) => (
        <Button
          size="xs"
          variant="outlineNeutral"
          rightIcon={<ChevronDown className="size-[11px]" />}
          onClick={() => setDetail(r)}
        >
          View Details
        </Button>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[200px]',
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          {r.status === 'Pending' ? (
            <Button
              size="xs"
              variant="primary"
              leftIcon={<Check className="size-[11px]" />}
              onClick={() => setRequestStatus(r.id, 'Accepted', `Request accepted for ${r.customerName}`)}
            >
              Accept
            </Button>
          ) : (
            <Button
              size="xs"
              variant="success"
              leftIcon={<Check className="size-[11px]" />}
              disabled={r.status === 'Completed'}
              onClick={() => setRequestStatus(r.id, 'Completed', `Request completed for ${r.customerName}`)}
            >
              Mark Completed
            </Button>
          )}
          <Button
            size="xs"
            variant="danger"
            leftIcon={<X className="size-[11px]" />}
            disabled={r.status === 'Completed'}
            onClick={() => setRejecting(r)}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Food Deals and Customer Request Management"
        underline
        notificationCount={12}
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
          <div className="grid min-w-0 gap-4">
            <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {dealStats.map((s, i) => {
                const Icon = statIcons[i]
                return (
                  <StatCard
                    key={s.key}
                    variant="pastel"
                    color={s.color}
                    icon={<Icon />}
                    label={s.label}
                    value={s.value}
                    caption={s.caption}
                  />
                )
              })}
            </section>

            {/* 1. Food deals management */}
            <Card className="p-4">
              <SectionTitle
                icon={<Tag className="size-[16px]" strokeWidth={2.4} />}
                action={
                  canManageDeals ? (
                    <Button size="sm" leftIcon={<Plus className="size-[14px]" />} onClick={openCreateDeal}>
                      Add New Deal
                    </Button>
                  ) : undefined
                }
              >
                1. Food Deals Management
              </SectionTitle>

              <div className="mt-3.5 overflow-hidden rounded-[10px]">
                {dealRows.length === 0 ? (
                  <EmptyState
                    icon={<Tag className="size-6" strokeWidth={1.7} />}
                    title="No food deals configured"
                    detail="Create a deal so guests can attach it to a reservation."
                    action={
                      canManageDeals ? (
                        <Button size="sm" variant="outline" onClick={openCreateDeal}>
                          Add New Deal
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <DataTable
                    variant="grid"
                    columns={dealColumns}
                    rows={dealRows}
                    rowKey={(d) => d.id}
                    minWidth={1000}
                  />
                )}
              </div>
            </Card>

            {/* 2. Customer special requests */}
            <Card className="p-4">
              <SectionTitle icon={<Users className="size-[16px] text-ink" strokeWidth={2.4} />}>
                <span className="text-ink">2. Customer Special Requests</span>
              </SectionTitle>

              <div className="mt-3.5 overflow-hidden rounded-[10px]">
                {requestRows.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-6" strokeWidth={1.7} />}
                    title="No special requests right now"
                    detail="Requests submitted with a booking will appear here for action."
                  />
                ) : (
                  <DataTable
                    variant="grid"
                    columns={requestColumns}
                    rows={requestRows}
                    rowKey={(r) => r.id}
                    minWidth={1150}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Right rail */}
          <div className="grid h-fit gap-4">
            <Card className="p-4">
              <SectionTitle icon={<Award className="size-[17px] text-gold-400" strokeWidth={2.2} />}>
                <span className="text-ink">Deal Performance Summary</span>
              </SectionTitle>

              <div className="mt-3 grid gap-2.5">
                <PerfTile bg="bg-[#FDF8EC]">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-ink-soft">{dealPerformance.mostSelected.title}</p>
                    <p className="mt-1 text-[17px] font-extrabold text-ink">{dealPerformance.mostSelected.name}</p>
                    <p className="mt-1.5 text-[10.5px] text-ink-muted">{dealPerformance.mostSelected.caption}</p>
                  </div>
                  <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full border border-gold-300 bg-white">
                    <Award className="size-[22px] text-gold-400" strokeWidth={1.8} />
                  </span>
                </PerfTile>

                <PerfTile bg="bg-[#FAFCF9]">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-ink-soft">{dealPerformance.conversion.title}</p>
                    <p className="mt-1 text-[20px] font-extrabold text-ink">{dealPerformance.conversion.value}</p>
                    <p className="mt-1.5 text-[10.5px]">
                      <span className="font-bold text-state-success">{dealPerformance.conversion.delta}</span>{' '}
                      <span className="text-ink-muted">{dealPerformance.conversion.caption}</span>
                    </p>
                  </div>
                  <TrendingUp className="size-[30px] shrink-0 text-gold-400" strokeWidth={2.2} />
                </PerfTile>

                <PerfTile bg="bg-[#FDFBF6]">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-ink-soft">{dealPerformance.revenue.title}</p>
                    <p className="mt-1 text-[19px] font-extrabold text-ink">{dealPerformance.revenue.value}</p>
                    <p className="mt-1.5 text-[10.5px] text-ink-muted">{dealPerformance.revenue.caption}</p>
                  </div>
                  <Wallet className="size-[28px] shrink-0 text-gold-400" strokeWidth={1.9} />
                </PerfTile>

                <PerfTile bg="bg-[#FDF1F1]">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-ink-soft">{dealPerformance.lowPerforming.title}</p>
                    <p className="mt-1 text-[17px] font-extrabold text-ink">{dealPerformance.lowPerforming.name}</p>
                    <p className="mt-1.5 text-[10.5px] text-ink-muted">{dealPerformance.lowPerforming.caption}</p>
                  </div>
                  <TrendingDown className="size-[28px] shrink-0 text-state-dangerSolid" strokeWidth={2.2} />
                </PerfTile>
              </div>
            </Card>

            <Card className="p-4">
              <SectionTitle icon={<Bell className="size-[16px] fill-brand-700" strokeWidth={2} />}>
                Request Alerts
              </SectionTitle>

              <ul className="mt-2 divide-y divide-line-soft">
                {requestAlerts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="focus-ring flex w-full items-center gap-3 rounded-lg py-3 text-left transition hover:bg-line-soft/60"
                    >
                      <span
                        className="flex size-[34px] shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${a.color}1A`, color: a.color }}
                      >
                        {a.icon === 'cake' && <Cake className="size-[17px]" />}
                        {a.icon === 'alert' && <AlertTriangle className="size-[17px]" />}
                        {a.icon === 'table' && <TableIcon className="size-[17px]" />}
                      </span>
                      <span className="text-[19px] font-extrabold text-ink">{a.count}</span>
                      <span className="min-w-0 flex-1 text-[11.5px] leading-snug text-ink-soft">{a.text}</span>
                      <ChevronRight className="size-[15px] shrink-0 text-ink-faint" />
                    </button>
                  </li>
                ))}
              </ul>

              <Button block className="mt-3" size="sm">
                View All Requests
              </Button>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={dealFormOpen}
        onClose={() => setDealFormOpen(false)}
        title={editingDeal ? `Edit ${editingDeal.name}` : 'Add New Deal'}
        subtitle="Deals can be attached to a reservation by occasion type."
        width="max-w-[560px]"
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setDealFormOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="deal-form">
              {editingDeal ? 'Save changes' : 'Create deal'}
            </Button>
          </>
        }
      >
        <form id="deal-form" noValidate onSubmit={saveDeal} className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="dl-name" required>
              Deal name
            </Label>
            <Input
              id="dl-name"
              value={dealDraft.name}
              error={dealErrors.name}
              placeholder="e.g. Birthday Special"
              onChange={(e) => {
                setDealDraft((d) => ({ ...d, name: e.target.value }))
                setDealErrors((x) => ({ ...x, name: undefined }))
              }}
            />
            <FieldError>{dealErrors.name}</FieldError>
          </div>

          <div>
            <Label htmlFor="dl-cat" required>
              Deal category
            </Label>
            <Select
              id="dl-cat"
              value={dealDraft.category}
              onChange={(e) => setDealDraft((d) => ({ ...d, category: e.target.value }))}
              options={dealCategories.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <Label htmlFor="dl-occ" required>
              Occasion type
            </Label>
            <Select
              id="dl-occ"
              value={dealDraft.occasion}
              onChange={(e) => setDealDraft((d) => ({ ...d, occasion: e.target.value }))}
              options={dealOccasions.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <Label htmlFor="dl-price" required>
              Price
            </Label>
            <Input
              id="dl-price"
              type="number"
              min={0}
              value={dealDraft.price}
              error={dealErrors.price}
              placeholder="1499"
              onChange={(e) => {
                setDealDraft((d) => ({ ...d, price: e.target.value }))
                setDealErrors((x) => ({ ...x, price: undefined }))
              }}
            />
            <FieldError>{dealErrors.price}</FieldError>
          </div>

          <div>
            <Label htmlFor="dl-status" required>
              Availability
            </Label>
            <Select
              id="dl-status"
              value={dealDraft.active ? 'Active' : 'Inactive'}
              onChange={(e) => setDealDraft((d) => ({ ...d, active: e.target.value === 'Active' }))}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="dl-items" required>
              Included items
            </Label>
            <Textarea
              id="dl-items"
              rows={3}
              value={dealDraft.items}
              error={dealErrors.items}
              placeholder="Main Course, Starter, Cake, Mocktail, Decoration"
              onChange={(e) => {
                setDealDraft((d) => ({ ...d, items: e.target.value }))
                setDealErrors((x) => ({ ...x, items: undefined }))
              }}
            />
            <FieldError>{dealErrors.items}</FieldError>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={removingDeal !== null}
        title="Delete this deal?"
        message={`${removingDeal?.name ?? ''} will be removed and can no longer be attached to a reservation.`}
        onCancel={() => setRemovingDeal(null)}
        onConfirm={() => {
          if (removingDeal) {
            setDealRows((prev) => prev.filter((x) => x.id !== removingDeal.id))
            push({ tone: 'info', title: 'Deal deleted', detail: removingDeal.name })
          }
          setRemovingDeal(null)
        }}
      />

      <ConfirmDialog
        open={rejecting !== null}
        title="Reject this request?"
        message={`${rejecting?.customerName ?? ''} will be told their special request could not be arranged.`}
        confirmLabel="Reject request"
        onCancel={() => setRejecting(null)}
        onConfirm={() => {
          if (rejecting) {
            setRequestRows((prev) => prev.filter((x) => x.id !== rejecting.id))
            push({ tone: 'info', title: 'Request rejected', detail: rejecting.customerName })
          }
          setRejecting(null)
        }}
      />

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.customerName} — ${detail.reservationId}` : ''}
        subtitle={detail ? `${detail.date} · ${detail.timeSlot} · ${detail.table}` : undefined}
        footer={
          <Button variant="outlineNeutral" size="sm" onClick={() => setDetail(null)}>
            Close
          </Button>
        }
      >
        {detail && (
          <dl className="grid gap-3 text-[13px]">
            <div>
              <dt className="font-semibold text-ink">Occasion</dt>
              <dd className="text-ink-muted">{detail.occasion}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Special request</dt>
              <dd className="text-ink-muted">{detail.request}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Status</dt>
              <dd className="mt-1">
                <Badge tone={requestTone[detail.status]}>{detail.status}</Badge>
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  )
}

function PerfTile({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-3 ${bg}`}>{children}</div>
  )
}

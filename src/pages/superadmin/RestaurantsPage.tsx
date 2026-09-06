import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Input, Label, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { RestaurantFormModal } from '@/components/superadmin/RestaurantFormModal'
import { usePlatform } from '@/store/PlatformContext'
import {
  cuisines,
  provinces,
  showcaseStatuses,
  type Restaurant,
  type ShowcaseStatus,
} from '@/data/restaurants'

const statusTone: Record<ShowcaseStatus, BadgeTone> = {
  Active: 'confirmed',
  Pending: 'pending',
  Suspended: 'cancelled',
  Inactive: 'neutral',
  Rejected: 'cancelled',
}

/** Directory-level administration: approval, status and record management. */
export function RestaurantsPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { restaurants, setRestaurantStatus, removeRestaurant, toggleFeatured } = usePlatform()

  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('All provinces')
  const [city, setCity] = useState('All cities')
  const [cuisine, setCuisine] = useState('All cuisines')
  const [status, setStatus] = useState('All statuses')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Restaurant | null>(null)
  const [detail, setDetail] = useState<Restaurant | null>(null)
  const [removing, setRemoving] = useState<Restaurant | null>(null)
  const [rejecting, setRejecting] = useState<Restaurant | null>(null)

  const cityOptions = useMemo(
    () => ['All cities', ...[...new Set(restaurants.map((r) => r.city))].sort()],
    [restaurants],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return restaurants
      .filter(
        (r) =>
          (province === 'All provinces' || r.province === province) &&
          (city === 'All cities' || r.city === city) &&
          (cuisine === 'All cuisines' || r.cuisine === cuisine) &&
          (status === 'All statuses' || r.status === status) &&
          (q === '' || r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.order - b.order)
  }, [restaurants, search, province, city, cuisine, status])

  const dirty =
    search !== '' ||
    province !== 'All provinces' ||
    city !== 'All cities' ||
    cuisine !== 'All cuisines' ||
    status !== 'All statuses'

  const clear = () => {
    setSearch('')
    setProvince('All provinces')
    setCity('All cities')
    setCuisine('All cuisines')
    setStatus('All statuses')
  }

  const counts = {
    total: restaurants.length,
    active: restaurants.filter((r) => r.status === 'Active').length,
    pending: restaurants.filter((r) => r.status === 'Pending').length,
    blocked: restaurants.filter((r) => r.status === 'Suspended' || r.status === 'Rejected').length,
  }

  const columns: Column<Restaurant>[] = [
    {
      key: 'name',
      header: 'Restaurant',
      className: 'font-semibold text-ink',
      render: (r) => (
        <button
          type="button"
          onClick={() => setDetail(r)}
          className="focus-ring flex items-center gap-2 rounded text-left hover:text-brand-700 hover:underline"
        >
          {r.featured && <Star className="size-[12px] shrink-0 fill-gold-400 text-gold-400" />}
          {r.name}
        </button>
      ),
    },
    { key: 'city', header: 'City', render: (r) => r.city },
    { key: 'province', header: 'Province', render: (r) => r.province },
    { key: 'cuisine', header: 'Cuisine', render: (r) => r.cuisine },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge>,
    },
    { key: 'added', header: 'Added', render: (r) => r.addedOn },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[280px]',
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          {r.status === 'Pending' ? (
            <>
              <Button
                size="xs"
                variant="success"
                leftIcon={<CheckCircle2 className="size-[11px]" />}
                onClick={() => {
                  setRestaurantStatus(r.id, 'Active')
                  push({ tone: 'success', title: 'Restaurant approved', detail: r.name })
                }}
              >
                Approve
              </Button>
              <Button
                size="xs"
                variant="danger"
                leftIcon={<XCircle className="size-[11px]" />}
                onClick={() => setRejecting(r)}
              >
                Reject
              </Button>
            </>
          ) : (
            <Select
              aria-label={`Status for ${r.name}`}
              value={r.status}
              className="h-[28px] w-[112px] text-[11px]"
              onChange={(e) => {
                setRestaurantStatus(r.id, e.target.value as ShowcaseStatus)
                push({ tone: 'success', title: `${r.name} → ${e.target.value}` })
              }}
              options={showcaseStatuses.map((s) => ({ value: s, label: s }))}
            />
          )}
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Pencil className="size-[11px]" />}
            onClick={() => {
              setEditing(r)
              setFormOpen(true)
            }}
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outlineDanger"
            leftIcon={<Trash2 className="size-[11px]" />}
            onClick={() => setRemoving(r)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Restaurants"
        underline
        onToggleNav={toggle}
        action={
          <Button
            leftIcon={<Plus className="size-[15px]" />}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Add Restaurant
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard variant="circleUp" color="#C99A3E" icon={<Building2 />} label="Total" value={String(counts.total)} caption="In the directory" />
          <StatCard variant="circleUp" color="#2E7D32" icon={<CheckCircle2 />} label="Active" value={String(counts.active)} caption="Published publicly" />
          <StatCard variant="circleUp" color="#E4572E" icon={<Clock />} label="Pending" value={String(counts.pending)} caption="Awaiting approval" />
          <StatCard variant="circleUp" color="#C0392B" icon={<XCircle />} label="Blocked" value={String(counts.blocked)} caption="Suspended or rejected" />
        </section>

        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="r-search">Search</Label>
              <Input
                id="r-search"
                trailing={<Search />}
                placeholder="Name or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="r-province">Province</Label>
              <Select
                id="r-province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                options={['All provinces', ...provinces].map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <Label htmlFor="r-city">City</Label>
              <Select
                id="r-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                options={cityOptions.map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <Label htmlFor="r-cuisine">Cuisine</Label>
              <Select
                id="r-cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                options={['All cuisines', ...cuisines].map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <Label htmlFor="r-status">Status</Label>
              <Select
                id="r-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={['All statuses', ...showcaseStatuses].map((p) => ({ value: p, label: p }))}
              />
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-3">
            <p className="text-[12px] text-ink-muted">
              Showing {filtered.length} of {restaurants.length} restaurants
            </p>
            <Link to="/superadmin/showcase">
              <Button size="sm" variant="outlineNeutral" leftIcon={<Eye className="size-[13px]" />}>
                Open Showcase Manager
              </Button>
            </Link>
          </div>

          <div className="mt-3 overflow-hidden rounded-[10px] border border-line">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-6" strokeWidth={1.7} />}
                title={dirty ? 'No restaurants match these filters' : 'No restaurants yet'}
                detail={
                  dirty
                    ? 'Try a different province, city, cuisine or status.'
                    : 'Add your first restaurant to the directory.'
                }
                action={
                  <Button size="sm" variant="outline" onClick={dirty ? clear : () => setFormOpen(true)}>
                    {dirty ? 'Clear filters' : 'Add Restaurant'}
                  </Button>
                }
              />
            ) : (
              <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} minWidth={1080} />
            )}
          </div>
        </Card>
      </div>

      <RestaurantFormModal
        open={formOpen}
        restaurant={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />

      {/* Detail */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? `${detail.city}, ${detail.province}` : undefined}
        width="max-w-[520px]"
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setDetail(null)}>
              Close
            </Button>
            {detail && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(detail)
                  setDetail(null)
                  setFormOpen(true)
                }}
              >
                Edit restaurant
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="grid gap-3.5">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-[10px] border border-line">
              {detail.image ? (
                <img src={detail.image} alt={detail.name} className="size-full object-cover" />
              ) : (
                <div
                  className="size-full"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${detail.cover[0]}, ${detail.cover[1]})`,
                  }}
                />
              )}
            </div>

            <p className="text-[13px] leading-relaxed text-ink-soft">{detail.description}</p>

            <dl className="grid gap-2 text-[12.5px]">
              {[
                ['Cuisine', detail.cuisine],
                ['Status', detail.status],
                ['Featured', detail.featured ? 'Yes' : 'No'],
                ['Carousel order', String(detail.order)],
                ['Added on', detail.addedOn],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line-soft pb-1.5 last:border-0">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={detail.featured ? 'primary' : 'outline'}
                leftIcon={<Star className="size-[13px]" />}
                onClick={() => {
                  toggleFeatured(detail.id)
                  setDetail({ ...detail, featured: !detail.featured })
                }}
              >
                {detail.featured ? 'Unfeature' : 'Mark featured'}
              </Button>
              {detail.website && (
                <a href={detail.website} target="_blank" rel="noreferrer noopener">
                  <Button size="sm" variant="outlineNeutral" leftIcon={<ExternalLink className="size-[13px]" />}>
                    Visit website
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={rejecting !== null}
        title={`Reject "${rejecting?.name ?? ''}"?`}
        message="The submission will be marked as rejected and stay out of the public showcase. You can change the status later."
        confirmLabel="Reject submission"
        onCancel={() => setRejecting(null)}
        onConfirm={() => {
          if (rejecting) {
            setRestaurantStatus(rejecting.id, 'Rejected')
            push({ tone: 'info', title: 'Submission rejected', detail: rejecting.name })
          }
          setRejecting(null)
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Delete "${removing?.name ?? ''}"?`}
        message="This removes the restaurant from the directory and the public showcase. This cannot be undone."
        confirmLabel="Delete restaurant"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            removeRestaurant(removing.id)
            push({ tone: 'info', title: 'Restaurant deleted', detail: removing.name })
          }
          setRemoving(null)
        }}
      />
    </>
  )
}

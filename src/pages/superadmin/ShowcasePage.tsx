import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Search,
  Star,
  Store,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Input, Label, Select } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/States'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { RestaurantFormModal } from '@/components/superadmin/RestaurantFormModal'
import { RestaurantShowcase } from '@/components/landing/RestaurantShowcase'
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

/** Curate the public carousel: order, featured flags, visibility and preview. */
export function ShowcasePage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const {
    restaurants,
    publicRestaurants,
    moveRestaurant,
    toggleFeatured,
    setRestaurantStatus,
    removeRestaurant,
    landing,
  } = usePlatform()

  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('All provinces')
  const [cuisine, setCuisine] = useState('All cuisines')
  const [status, setStatus] = useState('All statuses')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Restaurant | null>(null)
  const [removing, setRemoving] = useState<Restaurant | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  const ordered = useMemo(() => [...restaurants].sort((a, b) => a.order - b.order), [restaurants])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ordered.filter(
      (r) =>
        (province === 'All provinces' || r.province === province) &&
        (cuisine === 'All cuisines' || r.cuisine === cuisine) &&
        (status === 'All statuses' || r.status === status) &&
        (q === '' ||
          r.name.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q)),
    )
  }, [ordered, search, province, cuisine, status])

  const dirty =
    search !== '' ||
    province !== 'All provinces' ||
    cuisine !== 'All cuisines' ||
    status !== 'All statuses'

  const reorderable = !dirty

  return (
    <>
      <PageHeader
        title="Restaurant Showcase"
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
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-white px-4 py-3">
          <Store className="size-[17px] shrink-0 text-brand-700" />
          <p className="text-[12.5px] text-ink-soft">
            <span className="font-bold text-ink">{publicRestaurants.length}</span> of{' '}
            {restaurants.length} restaurants are live on the landing page. Only{' '}
            <strong>Active</strong> entries are published; featured ones lead the carousel.
          </p>
          <Button
            size="sm"
            variant="outlineNeutral"
            className="ml-auto"
            leftIcon={showPreview ? <EyeOff className="size-[13px]" /> : <Eye className="size-[13px]" />}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </Button>
        </div>

        {/* Live preview of the actual public carousel */}
        {showPreview && (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-[#F4F2EF] px-4 py-2.5">
              <Monitor className="size-[15px] text-ink-muted" />
              <p className="text-[11.5px] font-semibold text-ink-soft">
                Live preview — exactly what visitors see at <code>/#restaurants</code>
              </p>
            </div>
            <div className="max-h-[620px] overflow-y-auto">
              <RestaurantShowcase
                eyebrow={landing.showcaseEyebrow}
                title={landing.showcaseTitle}
                lead={landing.showcaseLead}
              />
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4">
          <SectionTitle icon={<Search className="size-[16px]" strokeWidth={2.3} />}>
            Directory &amp; Order
          </SectionTitle>

          <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="sc-search">Search</Label>
              <Input
                id="sc-search"
                trailing={<Search />}
                placeholder="Name, city or cuisine"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sc-province">Province</Label>
              <Select
                id="sc-province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                options={['All provinces', ...provinces].map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <Label htmlFor="sc-cuisine">Cuisine</Label>
              <Select
                id="sc-cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                options={['All cuisines', ...cuisines].map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <Label htmlFor="sc-status">Status</Label>
              <Select
                id="sc-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={['All statuses', ...showcaseStatuses].map((p) => ({ value: p, label: p }))}
              />
            </div>
          </div>

          {dirty && (
            <p className="mt-3 rounded-[8px] bg-[#FDF3DC] px-3 py-2 text-[11.5px] text-ink-soft">
              Reordering is disabled while filters are applied — clear them to change carousel order.{' '}
              <button
                type="button"
                className="font-bold text-brand-700 hover:underline"
                onClick={() => {
                  setSearch('')
                  setProvince('All provinces')
                  setCuisine('All cuisines')
                  setStatus('All statuses')
                }}
              >
                Clear filters
              </button>
            </p>
          )}

          {/* Ordered list */}
          <div className="mt-3.5">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Store className="size-6" strokeWidth={1.7} />}
                title={dirty ? 'No restaurants match these filters' : 'No restaurants yet'}
                detail={
                  dirty
                    ? 'Try a different province, cuisine or search term.'
                    : 'Add your first restaurant to the public showcase.'
                }
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (dirty) {
                        setSearch('')
                        setProvince('All provinces')
                        setCuisine('All cuisines')
                        setStatus('All statuses')
                      } else {
                        setEditing(null)
                        setFormOpen(true)
                      }
                    }}
                  >
                    {dirty ? 'Clear filters' : 'Add Restaurant'}
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-2">
                {filtered.map((r, i) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-white px-3 py-3"
                  >
                    {/* order controls */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="flex size-7 items-center justify-center rounded-[7px] bg-brand-50 text-[11px] font-bold text-brand-700">
                        {r.order}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          aria-label={`Move ${r.name} up`}
                          disabled={!reorderable || i === 0}
                          onClick={() => moveRestaurant(r.id, -1)}
                          className="focus-ring rounded p-0.5 text-ink-faint transition hover:text-brand-700 disabled:opacity-30 disabled:hover:text-ink-faint"
                        >
                          <ArrowUp className="size-[13px]" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${r.name} down`}
                          disabled={!reorderable || i === filtered.length - 1}
                          onClick={() => moveRestaurant(r.id, 1)}
                          className="focus-ring rounded p-0.5 text-ink-faint transition hover:text-brand-700 disabled:opacity-30 disabled:hover:text-ink-faint"
                        >
                          <ArrowDown className="size-[13px]" />
                        </button>
                      </div>
                    </div>

                    {/* thumbnail at the real card ratio */}
                    <span className="h-[46px] w-[74px] shrink-0 overflow-hidden rounded-[7px] border border-line">
                      {r.image ? (
                        <img src={r.image} alt="" className="size-full object-cover" />
                      ) : (
                        <span
                          className="block size-full"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${r.cover[0]}, ${r.cover[1]})`,
                          }}
                        />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink">
                        {r.name}
                        {r.featured && (
                          <Badge tone="selected">
                            <Star className="mr-1 size-[9px] fill-current" />
                            Featured
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-[11px]" />
                          {r.city}, {r.province}
                        </span>
                        <span className="text-ink-faint">·</span>
                        {r.cuisine}
                      </p>
                    </div>

                    <Select
                      aria-label={`Status for ${r.name}`}
                      value={r.status}
                      className="h-[32px] w-[122px] shrink-0 text-xs"
                      onChange={(e) => {
                        setRestaurantStatus(r.id, e.target.value as ShowcaseStatus)
                        push({ tone: 'success', title: `${r.name} → ${e.target.value}` })
                      }}
                      options={showcaseStatuses.map((s) => ({ value: s, label: s }))}
                    />

                    <Badge tone={statusTone[r.status]}>{r.status}</Badge>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="xs"
                        variant={r.featured ? 'primary' : 'outlineNeutral'}
                        leftIcon={<Star className={cn('size-[11px]', r.featured && 'fill-current')} />}
                        onClick={() => {
                          toggleFeatured(r.id)
                          push({
                            tone: 'success',
                            title: r.featured ? 'Removed from featured' : 'Marked as featured',
                            detail: r.name,
                          })
                        }}
                      >
                        {r.featured ? 'Featured' : 'Feature'}
                      </Button>
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
                  </li>
                ))}
              </ul>
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

      <ConfirmDialog
        open={removing !== null}
        title={`Delete "${removing?.name ?? ''}"?`}
        message="This restaurant will be removed from the public restaurant showcase and the directory. This cannot be undone."
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

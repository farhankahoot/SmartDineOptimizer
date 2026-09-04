import { useEffect, useState, type FormEvent } from 'react'
import { Globe, MapPin, Store, UtensilsCrossed } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Select, Textarea, Toggle } from '@/components/ui/Field'
import { usePlatform, type NewRestaurant } from '@/store/PlatformContext'
import { ImageUploadField } from './ImageUploadField'
import {
  cities,
  cuisines,
  provinces,
  showcaseStatuses,
  type Province,
  type Restaurant,
  type ShowcaseStatus,
} from '@/data/restaurants'

interface Draft {
  name: string
  city: string
  province: Province
  cuisine: string
  description: string
  website: string
  image?: string
  featured: boolean
  status: ShowcaseStatus
}

const blank: Draft = {
  name: '',
  city: 'Lahore',
  province: 'Punjab',
  cuisine: cuisines[0],
  description: '',
  website: '',
  featured: false,
  status: 'Pending',
}

/** Gradient assigned to a new record so the card always has a usable cover. */
const covers: [string, string][] = [
  ['#7A1113', '#2A1410'],
  ['#8E4B14', '#2A1A10'],
  ['#12495E', '#0D1F2A'],
  ['#1F5140', '#0F211C'],
  ['#5E1338', '#22101B'],
  ['#243B70', '#101828'],
]

export function RestaurantFormModal({
  open,
  onClose,
  restaurant,
}: {
  open: boolean
  onClose: () => void
  restaurant?: Restaurant | null
}) {
  const { addRestaurant, updateRestaurant, restaurants } = usePlatform()
  const editing = Boolean(restaurant)

  const [draft, setDraft] = useState<Draft>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [customCity, setCustomCity] = useState('')
  const [useCustomCity, setUseCustomCity] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setUseCustomCity(false)
    setCustomCity('')
    setDraft(
      restaurant
        ? {
            name: restaurant.name,
            city: restaurant.city,
            province: restaurant.province,
            cuisine: restaurant.cuisine,
            description: restaurant.description,
            website: restaurant.website ?? '',
            image: restaurant.image,
            featured: restaurant.featured,
            status: restaurant.status,
          }
        : blank,
    )
  }, [open, restaurant])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    const city = useCustomCity ? customCity.trim() : draft.city

    if (!draft.name.trim()) next.name = 'Restaurant name is required.'
    else if (
      restaurants.some(
        (r) => r.id !== restaurant?.id && r.name.toLowerCase() === draft.name.trim().toLowerCase(),
      )
    )
      next.name = 'A restaurant with this name is already in the directory.'

    if (!city) next.city = 'City is required.'
    if (!draft.description.trim()) next.description = 'Add a short description for the card.'
    else if (draft.description.trim().length > 160)
      next.description = 'Keep the description under 160 characters so it fits the card.'

    if (draft.website.trim() && !/^https?:\/\/.+\..+/.test(draft.website.trim()))
      next.website = 'Enter a full URL, e.g. https://example.pk'

    setErrors(next)
    if (Object.keys(next).length) return

    const payload: NewRestaurant = {
      name: draft.name.trim(),
      city,
      province: draft.province,
      cuisine: draft.cuisine,
      description: draft.description.trim(),
      website: draft.website.trim() || undefined,
      image: draft.image,
      cover: restaurant?.cover ?? covers[restaurants.length % covers.length],
      featured: draft.featured,
      status: draft.status,
    }

    if (editing && restaurant) updateRestaurant(restaurant.id, payload)
    else addRestaurant(payload)

    onClose()
  }

  const cover = restaurant?.cover ?? covers[restaurants.length % covers.length]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${restaurant?.name}` : 'Add restaurant to showcase'}
      subtitle="Appears in the Pakistan restaurant carousel on the public landing page."
      width="max-w-[720px]"
      footer={
        <>
          <Button variant="outlineNeutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="restaurant-form">
            {editing ? 'Save changes' : 'Add restaurant'}
          </Button>
        </>
      }
    >
      <form id="restaurant-form" noValidate onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-3.5">
          <div>
            <Label htmlFor="rf-name" required>
              Restaurant name
            </Label>
            <Input
              id="rf-name"
              icon={<Store />}
              value={draft.name}
              error={errors.name}
              placeholder="e.g. Andaaz Restaurant"
              onChange={(e) => set('name', e.target.value)}
            />
            <FieldError>{errors.name}</FieldError>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="rf-province" required>
                Province
              </Label>
              <Select
                id="rf-province"
                value={draft.province}
                onChange={(e) => set('province', e.target.value as Province)}
                options={provinces.map((p) => ({ value: p, label: p }))}
              />
            </div>

            <div>
              <Label htmlFor="rf-city" required>
                City
              </Label>
              {useCustomCity ? (
                <Input
                  id="rf-city"
                  icon={<MapPin />}
                  value={customCity}
                  error={errors.city}
                  placeholder="New city name"
                  onChange={(e) => {
                    setCustomCity(e.target.value)
                    setErrors((x) => ({ ...x, city: undefined }))
                  }}
                />
              ) : (
                <Select
                  id="rf-city"
                  icon={<MapPin />}
                  value={draft.city}
                  error={errors.city}
                  onChange={(e) => set('city', e.target.value)}
                  options={cities
                    .filter((c) => c.province === draft.province)
                    .map((c) => ({ value: c.name, label: c.name }))}
                />
              )}
              <button
                type="button"
                onClick={() => setUseCustomCity((v) => !v)}
                className="focus-ring mt-1 rounded text-[11px] font-semibold text-brand-700 hover:underline"
              >
                {useCustomCity ? 'Pick from the list' : 'Add a different city'}
              </button>
              <FieldError>{errors.city}</FieldError>
            </div>
          </div>

          <div>
            <Label htmlFor="rf-cuisine" required>
              Cuisine
            </Label>
            <Select
              id="rf-cuisine"
              icon={<UtensilsCrossed />}
              value={draft.cuisine}
              onChange={(e) => set('cuisine', e.target.value)}
              options={cuisines.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <Label htmlFor="rf-desc" required hint="(shown on the card)">
              Short description
            </Label>
            <Textarea
              id="rf-desc"
              rows={3}
              maxLength={180}
              value={draft.description}
              error={errors.description}
              counter={`${draft.description.length}/160`}
              placeholder="One or two lines about the dining room."
              onChange={(e) => set('description', e.target.value)}
            />
            <FieldError>{errors.description}</FieldError>
          </div>

          <div>
            <Label htmlFor="rf-site" hint="(optional)">
              Website
            </Label>
            <Input
              id="rf-site"
              icon={<Globe />}
              value={draft.website}
              error={errors.website}
              placeholder="https://example.pk"
              onChange={(e) => set('website', e.target.value)}
            />
            <FieldError>{errors.website}</FieldError>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="rf-status" required>
                Status
              </Label>
              <Select
                id="rf-status"
                value={draft.status}
                onChange={(e) => set('status', e.target.value as ShowcaseStatus)}
                options={showcaseStatuses.map((s) => ({ value: s, label: s }))}
              />
              <p className="mt-1 text-[10.5px] text-ink-faint">
                Only <strong>Active</strong> restaurants appear publicly.
              </p>
            </div>

            <div>
              <Label>Featured</Label>
              <div className="flex h-[42px] items-center gap-2.5 rounded-[8px] border border-line px-3">
                <Toggle
                  label="Featured restaurant"
                  checked={draft.featured}
                  onChange={(v) => set('featured', v)}
                />
                <span className="text-[12px] text-ink-soft">
                  {draft.featured ? 'Shown first' : 'Standard order'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ImageUploadField
          value={draft.image}
          fallback={cover}
          onChange={(dataUrl) => set('image', dataUrl)}
        />
      </form>
    </Modal>
  )
}

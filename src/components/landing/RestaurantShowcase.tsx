import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { usePlatform } from '@/store/PlatformContext'
import type { Restaurant } from '@/data/restaurants'

const AUTOPLAY_MS = 5200

/**
 * Premium restaurant carousel for the landing page.
 *
 * Cards render their cover in an `aspect-[16/10]` box with `object-fit: cover` —
 * the Showcase Manager derives its upload guidance from exactly this container.
 */
export function RestaurantShowcase({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string
  title: string
  lead: string
}) {
  const { publicRestaurants } = usePlatform()

  const [filter, setFilter] = useState('All Pakistan')
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)

  const filters = useMemo(() => {
    const provinceCounts = new Map<string, number>()
    publicRestaurants.forEach((r) => {
      provinceCounts.set(r.province, (provinceCounts.get(r.province) ?? 0) + 1)
    })
    return [
      'All Pakistan',
      ...[...provinceCounts.keys()].sort((a, b) => a.localeCompare(b)),
    ]
  }, [publicRestaurants])

  const list = useMemo(() => {
    const scoped =
      filter === 'All Pakistan'
        ? publicRestaurants
        : publicRestaurants.filter((r) => r.province === filter)
    // Featured entries lead, then curated order.
    return [...scoped].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order)
  }, [publicRestaurants, filter])

  const count = list.length

  const go = useCallback(
    (next: number) => {
      if (count === 0) return
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  // Reset when the filter changes the set out from under us.
  useEffect(() => setIndex(0), [filter])

  // Autoplay, paused on hover/focus and when the user prefers reduced motion.
  useEffect(() => {
    if (paused || count <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, count])

  // Keep the active card scrolled into view on narrow screens.
  useEffect(() => {
    const track = trackRef.current
    const card = track?.children[index] as HTMLElement | undefined
    if (!track || !card) return
    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft - 16,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [index])

  if (count === 0) {
    return (
      <section id="restaurants" className="scroll-mt-20 bg-page py-16 lg:py-24">
        <div className="mx-auto max-w-[1240px] px-5 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand-700">{eyebrow}</p>
          <h2 className="mt-2.5 text-[26px] font-extrabold tracking-[-0.025em] text-ink sm:text-[34px]">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[14px] text-ink-muted">
            No restaurants are published yet. They appear here as soon as an administrator adds
            them to the showcase.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="restaurants" className="scroll-mt-20 overflow-hidden bg-page py-16 lg:py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        {/* Heading */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[620px]">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand-700">
              {eyebrow}
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold tracking-[-0.025em] text-ink sm:text-[34px]">
              {title}
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ink-muted">{lead}</p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <CarouselButton label="Previous restaurant" onClick={() => go(index - 1)}>
              <ChevronLeft className="size-[18px]" />
            </CarouselButton>
            <CarouselButton label="Next restaurant" onClick={() => go(index + 1)}>
              <ChevronRight className="size-[18px]" />
            </CarouselButton>
          </div>
        </div>

        {/* Province filter */}
        <div
          className="mt-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
          role="tablist"
          aria-label="Filter restaurants by province"
        >
          {filters.map((f) => {
            const active = f === filter
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f)}
                className={cn(
                  'focus-ring shrink-0 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition',
                  active
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700',
                )}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>

      {/* Track */}
      <div
        className="mt-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Restaurants across Pakistan"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              go(index + 1)
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              go(index - 1)
            }
          }}
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return
            const delta = e.changedTouches[0].clientX - touchStart.current
            if (Math.abs(delta) > 48) go(index + (delta < 0 ? 1 : -1))
            touchStart.current = null
          }}
          className={cn(
            'flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 no-scrollbar',
            'focus-visible:outline-none',
            // Centre the active card on wide screens.
            'lg:px-[max(1.25rem,calc((100vw-1240px)/2))]',
          )}
        >
          {list.map((r, i) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              active={i === index}
              onSelect={() => go(i)}
              position={i + 1}
              total={count}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto mt-6 flex max-w-[1240px] items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-2 lg:hidden">
          <CarouselButton label="Previous restaurant" onClick={() => go(index - 1)}>
            <ChevronLeft className="size-[18px]" />
          </CarouselButton>
          <CarouselButton label="Next restaurant" onClick={() => go(index + 1)}>
            <ChevronRight className="size-[18px]" />
          </CarouselButton>
        </div>

        <ul className="flex flex-1 items-center justify-center gap-1.5" aria-hidden="true">
          {list.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => go(i)}
                className={cn(
                  'h-[5px] rounded-full transition-all duration-300',
                  i === index ? 'w-7 bg-brand-700' : 'w-[5px] bg-ink-faint/40 hover:bg-ink-faint',
                )}
              />
            </li>
          ))}
        </ul>

        <p className="shrink-0 text-[12px] font-semibold text-ink-muted" aria-live="polite">
          {index + 1} / {count}
        </p>
      </div>
    </section>
  )
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="focus-ring flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-card transition hover:border-brand-300 hover:text-brand-700"
    >
      {children}
    </button>
  )
}

function RestaurantCard({
  restaurant,
  active,
  onSelect,
  position,
  total,
}: {
  restaurant: Restaurant
  active: boolean
  onSelect: () => void
  position: number
  total: number
}) {
  const { name, city, province, cuisine, description, image, cover, featured, website } = restaurant

  return (
    <article
      onClick={onSelect}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}: ${name}, ${city}`}
      className={cn(
        'group relative w-[300px] shrink-0 snap-center overflow-hidden rounded-panel border bg-white text-left',
        'transition-[transform,box-shadow,opacity,border-color] duration-500 motion-reduce:transition-none',
        'sm:w-[360px] lg:w-[400px]',
        active
          ? 'border-line opacity-100 shadow-[0_24px_60px_-28px_rgba(16,15,14,.5)] lg:scale-100'
          : 'border-line/70 opacity-75 shadow-card hover:opacity-95 lg:scale-[0.955]',
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${name} in ${city}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.06] motion-reduce:transition-none"
          />
        ) : (
          <div
            role="img"
            aria-label={`${name} — no photograph uploaded`}
            className="size-full transition-transform duration-[900ms] group-hover:scale-[1.06] motion-reduce:transition-none"
            style={{ backgroundImage: `linear-gradient(135deg, ${cover[0]}, ${cover[1]})` }}
          />
        )}

        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,14,0)_38%,rgba(12,12,14,.82)_100%)]"
          aria-hidden="true"
        />

        {featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400/95 px-2.5 py-1 text-[10.5px] font-bold text-[#2A1E05]">
            <Star className="size-[11px] fill-current" />
            Featured
          </span>
        )}

        <div className="absolute inset-x-4 bottom-3.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white/85">
            <MapPin className="size-[13px]" />
            {city}
            <span className="text-white/45">·</span>
            <span className="text-white/70">{province}</span>
          </p>
          <h3 className="mt-1 text-[19px] font-extrabold leading-tight tracking-[-0.015em] text-white">
            {name}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4">
        <span className="w-fit rounded-[6px] bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
          {cuisine}
        </span>

        <p className="min-h-[52px] text-[12.5px] leading-relaxed text-ink-muted">{description}</p>

        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="focus-ring inline-flex w-fit items-center gap-1.5 rounded text-[12.5px] font-bold text-brand-700 transition group-hover:gap-2.5"
          >
            Visit restaurant
            <ArrowUpRight className="size-[14px]" />
          </a>
        ) : (
          <span className="text-[12px] font-semibold text-ink-faint">Listed in the directory</span>
        )}
      </div>
    </article>
  )
}

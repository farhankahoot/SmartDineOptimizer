import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Indicator {
  left: number
  width: number
  /** False before the first measurement, so it fades in rather than sliding from 0. */
  ready: boolean
}

/**
 * A single underline that slides between navigation items.
 *
 * One moving element rather than an underline per item: the travel between
 * links is what makes the bar read as a position indicator instead of a
 * decoration that blinks on and off.
 *
 * Positions are measured from the DOM because the items are text of varying
 * width. Re-measured when the active item changes, on resize, and once web
 * fonts have loaded — a heading measured in the fallback font is a few pixels
 * narrower, which would leave the bar visibly misaligned on first paint.
 */
export function useNavIndicator(activeKey: string | null) {
  const containerRef = useRef<HTMLElement | null>(null)
  const items = useRef(new Map<string, HTMLElement>())
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, width: 0, ready: false })

  /** Passed as a ref callback to each nav item. */
  const registerItem = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      if (node) items.current.set(key, node)
      else items.current.delete(key)
    },
    [],
  )

  const measure = useCallback(() => {
    const container = containerRef.current
    const node = activeKey ? items.current.get(activeKey) : undefined

    if (!container || !node) {
      setIndicator((prev) => ({ ...prev, width: 0 }))
      return
    }

    const c = container.getBoundingClientRect()
    const n = node.getBoundingClientRect()
    setIndicator({ left: n.left - c.left, width: n.width, ready: true })
  }, [activeKey])

  // Before paint, so the bar is never briefly in the wrong place.
  useLayoutEffect(measure, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)

    // Fonts change text width; re-measure once they are in.
    document.fonts?.ready.then(measure).catch(() => undefined)

    // The container itself can change width (a CTA appearing, a scroll bar).
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (observer && containerRef.current) observer.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [measure])

  return { containerRef, registerItem, indicator }
}

/**
 * Which section is currently in view, for a page of anchored sections.
 *
 * Uses scroll position against each section's offset rather than
 * IntersectionObserver ratios: with sections of very different heights, the
 * "most visible" one is not the one a reader is looking at. This picks the
 * last section whose top has passed a line a third of the way down the
 * viewport, which matches where attention actually sits.
 */
export function useSectionSpy(ids: string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || ids.length === 0) return

    let queued = false

    const update = () => {
      queued = false
      const line = window.scrollY + window.innerHeight / 3

      let current: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        // Document-relative top. `offsetTop` is measured from the nearest
        // positioned ancestor, and these sections sit inside wrappers, so it
        // reported a few pixels rather than the position on the page.
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= line) current = id
      }

      // Near the bottom, the last section is the one being read even if its
      // top never crosses the line.
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 80
      if (atBottom) {
        const last = [...ids].reverse().find((id) => document.getElementById(id))
        if (last) current = last
      }

      setActive(current)
    }

    /*
     * Coalesced with a short timer rather than requestAnimationFrame.
     *
     * rAF is suspended entirely while a tab is hidden, which would leave the
     * indicator frozen on whatever section it last saw. A timeout still fires,
     * and 60ms is under the threshold at which the movement stops feeling
     * attached to the scroll.
     */
    let timer: number | undefined

    const onScroll = () => {
      if (queued) return
      queued = true
      timer = window.setTimeout(update, 60)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearTimeout(timer)
    }
  }, [ids, enabled])

  return active
}

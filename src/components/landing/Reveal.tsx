import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Scroll-triggered entrance.
 *
 * Elements start slightly low and transparent, then settle when they first
 * enter the viewport. The observer disconnects after firing, so scrolling back
 * up does not replay the animation — repeated motion on every pass is the
 * thing that makes a page feel cheap.
 *
 * Anyone who has asked their system for reduced motion gets the final state
 * immediately, with no transition at all.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Reveal({
  children,
  /** Milliseconds to wait after the element appears — used to stagger grids. */
  delay = 0,
  /** `up` is the default; `fade` is for large blocks where movement is noisy. */
  variant = 'up',
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  variant?: 'up' | 'fade' | 'left' | 'right' | 'scale'
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const node = ref.current
    if (!node) return

    /*
     * Anything already on screen when the page loads is shown at once.
     *
     * Above-the-fold content must never depend on an observer callback: if
     * that callback is delayed — a background tab, a throttled first paint —
     * the visitor is looking at an empty hero. Deferring to the next frame
     * lets the browser paint the hidden state first, so it still animates in
     * rather than snapping.
     */
    const onScreen = node.getBoundingClientRect().top < window.innerHeight
    if (onScreen || typeof IntersectionObserver === 'undefined') {
      // A timer rather than requestAnimationFrame: rAF is suspended entirely
      // while a tab is hidden, so a page opened in a background tab would
      // paint its hero as blank. A timeout still fires, and the one-tick
      // delay is enough for the browser to paint the hidden state first so
      // the content animates in rather than snapping.
      const timer = window.setTimeout(() => setShown(true), 0)
      return () => window.clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      // Fires a little before the element is fully on screen, so the motion
      // has finished by the time it is properly in view.
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const hidden = {
    up: 'translate-y-7 opacity-0',
    fade: 'opacity-0',
    left: '-translate-x-7 opacity-0',
    right: 'translate-x-7 opacity-0',
    scale: 'scale-[0.97] opacity-0',
  }[variant]

  return (
    <Tag
      ref={ref as never}
      /*
       * `data-shown` lets children run their own entrance without each one
       * needing its own observer: a descendant styles itself with
       * `group-data-[shown=true]/reveal:…` and animates when this block does.
       * The group is named so it cannot collide with a `group` a caller sets
       * on its own markup for hover.
       */
      data-shown={shown ? 'true' : 'false'}
      style={shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'group/reveal',
        'motion-safe:transition-all motion-safe:duration-[620ms] motion-safe:ease-[cubic-bezier(.22,1,.36,1)]',
        shown ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : hidden,
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/**
 * Counts up to a value once it scrolls into view.
 *
 * Uses requestAnimationFrame against a wall-clock start rather than a fixed
 * per-frame step, so the duration is the same on a 60Hz and a 144Hz display.
 */
export function CountUp({
  to,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState(prefersReducedMotion() ? to : 0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(to)
      return
    }

    const node = ref.current
    if (!node) return
    let frame = 0

    if (typeof IntersectionObserver === 'undefined') {
      setValue(to)
      return
    }

    /*
     * A frozen count-up shows the wrong number, which is worse than showing no
     * animation at all: a stat that stops at "1%" on its way to "20%" is a
     * false claim. requestAnimationFrame is suspended while a tab is hidden,
     * so the animation is only started when the page is actually visible, and
     * it snaps to the real figure if visibility is lost part-way through.
     */
    const settle = () => {
      cancelAnimationFrame(frame)
      setValue(to)
    }

    const run = () => {
      // Hidden tabs suspend rAF, which would strand the number part-way to its
      // target. Show the real figure instead and skip the animation.
      if (document.hidden) {
        settle()
        return
      }

      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration)
        // Ease-out cubic: fast at first, settling gently on the final value.
        setValue(to * (1 - Math.pow(1 - progress, 3)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    // Already on screen — the observer's first callback can be deferred, and a
    // stat showing 0 while it waits is a wrong number on the page.
    if (node.getBoundingClientRect().top < window.innerHeight) {
      run()
      return () => {
        cancelAnimationFrame(frame)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        run()
      },
      { threshold: 0.4 },
    )

    const onVisibilityChange = () => {
      if (document.hidden) settle()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    observer.observe(node)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      cancelAnimationFrame(frame)
    }
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString('en-PK', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

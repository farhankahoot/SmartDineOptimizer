import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Shared surfaces for the landing page.
 *
 * The console's `Card` is deliberately flat and dense — right for a worklist,
 * wrong for a marketing page. These carry the same brand colours with more
 * presence: a gold hairline that lights on hover, and a maroon glow that only
 * appears on pointer devices.
 */

/** Small uppercase label that opens a section. */
export function Eyebrow({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]',
        tone === 'dark' ? 'text-gold-400' : 'text-brand-700',
      )}
    >
      <span
        className={cn(
          'h-px w-6',
          tone === 'dark' ? 'bg-gold-400/60' : 'bg-brand-700/40',
        )}
      />
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = 'light',
  align = 'left',
  className,
}: {
  eyebrow: string
  title: ReactNode
  lead?: string
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        align === 'center' ? 'mx-auto max-w-[680px] text-center' : 'max-w-[620px]',
        className,
      )}
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          'mt-3 text-balance text-[27px] font-extrabold leading-[1.14] tracking-[-0.02em] sm:text-[34px]',
          tone === 'dark' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            'mt-3.5 text-pretty text-[14px] leading-relaxed',
            tone === 'dark' ? 'text-white/62' : 'text-ink-muted',
          )}
        >
          {lead}
        </p>
      )}
    </div>
  )
}

/**
 * The landing card.
 *
 * `group` is set here so children can react to hover — the icon tile lifts and
 * the corner glow fades in — without every caller repeating the class.
 */
export function GlowCard({
  children,
  tone = 'light',
  className,
  interactive = true,
}: {
  children: ReactNode
  tone?: 'light' | 'dark'
  className?: string
  interactive?: boolean
}) {
  return (
    <article
      className={cn(
        'group relative isolate overflow-hidden rounded-[16px] p-5',
        'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
        tone === 'dark'
          ? 'border border-white/10 bg-white/[0.035] backdrop-blur-sm'
          : 'border border-line bg-white shadow-card',
        interactive &&
          (tone === 'dark'
            ? 'hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/[0.06]'
            : 'hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop'),
        className,
      )}
    >
      {/* Corner wash — sits behind the content and only shows on hover. */}
      {interactive && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -right-16 -top-16 -z-10 size-40 rounded-full opacity-0 blur-2xl',
            'motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100',
            tone === 'dark' ? 'bg-gold-400/20' : 'bg-brand-700/10',
          )}
        />
      )}
      {children}
    </article>
  )
}

/** Rounded icon tile that reacts to its card's hover state. */
export function IconTile({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-[42px] shrink-0 items-center justify-center rounded-[12px] [&>svg]:size-[19px]',
        'motion-safe:transition-transform motion-safe:duration-300 group-hover:-translate-y-0.5',
        tone === 'dark'
          ? 'bg-gold-400/12 text-gold-300 ring-1 ring-inset ring-gold-400/25'
          : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Section shell with consistent rhythm.
 *
 * Vertical padding is set once here so sections cannot drift apart, which is
 * what made the previous page feel like separate pages stitched together.
 */
export function Section({
  children,
  id,
  tone = 'light',
  className,
}: {
  children: ReactNode
  id?: string
  tone?: 'light' | 'cream' | 'dark'
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative px-5 py-16 lg:py-20',
        tone === 'dark' && 'overflow-hidden bg-[#0C0C0E]',
        tone === 'cream' && 'bg-page',
        tone === 'light' && 'bg-white',
        className,
      )}
    >
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </section>
  )
}

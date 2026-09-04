import { cn } from '@/lib/cn'

/**
 * "Asian Wok — by MONAL" lockup as it appears in the sidebar and on the public
 * site header: red brush-script "Asian" overlapping a heavy white "WOK" that is
 * struck through by a red swoosh, with a letter-spaced tagline underneath.
 */
export function BrandLogo({
  className,
  scale = 1,
  tagline = 'by MONAL',
}: {
  className?: string
  scale?: number
  tagline?: string
}) {
  return (
    <div
      className={cn('relative select-none leading-none', className)}
      style={{ width: 150 * scale, height: 58 * scale }}
      aria-label="Asian Wok by Monal"
    >
      <svg viewBox="0 0 150 58" className="size-full overflow-visible" role="img">
        <title>Asian Wok by Monal</title>

        {/* "Asian" — brush script, sits above and overlaps the W */}
        <text
          x="14"
          y="24"
          fill="#E23A34"
          fontFamily="'Brush Script MT','Segoe Script','Lucida Handwriting',cursive"
          fontSize="34"
          fontStyle="italic"
          fontWeight="700"
        >
          Asian
        </text>

        {/* Red swoosh sweeping out of the K */}
        <path
          d="M12 47.2c28 3.4 84 3.6 132 -4.2"
          fill="none"
          stroke="#C0161A"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* "WOK" — heavy, tight, white */}
        <text
          x="75"
          y="45"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Figtree, system-ui, sans-serif"
          fontSize="38"
          fontWeight="900"
          letterSpacing="-1.8"
        >
          WOK
        </text>

        <text
          x="75"
          y="55"
          textAnchor="middle"
          fill="#DFDAD2"
          fontFamily="Figtree, system-ui, sans-serif"
          fontSize="7"
          fontWeight="700"
          letterSpacing="1.6"
        >
          {tagline}
        </text>
      </svg>
    </div>
  )
}

/** Thin gold rule with a centre ornament, directly beneath the sidebar logo. */
export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-5', className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-600/70 to-gold-500/80" />
      <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true">
        <path
          d="M8 0.8 10.4 4 8 7.2 5.6 4Z M1 4h3.4 M11.6 4H15"
          fill="none"
          stroke="#C8A34A"
          strokeWidth="1"
        />
        <circle cx="8" cy="4" r="1.1" fill="#C8A34A" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-600/70 to-gold-500/80" />
    </div>
  )
}

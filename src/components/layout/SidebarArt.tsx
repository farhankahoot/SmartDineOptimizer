/**
 * Gold line-art motif that fills the empty lower half of the sidebar in the
 * mockups: a pagoda silhouette above stacked "seigaiha" wave arcs.
 */
export function SidebarArt() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[92px] select-none" aria-hidden="true">
      <svg viewBox="0 0 240 170" className="w-full" fill="none">
        <defs>
          <linearGradient id="wok-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9C46A" stopOpacity=".85" />
            <stop offset="100%" stopColor="#B7862A" stopOpacity=".25" />
          </linearGradient>
          <linearGradient id="wok-gold-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D8AE55" stopOpacity=".55" />
            <stop offset="100%" stopColor="#8A6520" stopOpacity=".12" />
          </linearGradient>
        </defs>

        {/* Pagoda */}
        <g transform="translate(148 18)" fill="url(#wok-gold)">
          <path d="M22 0 34 9H10z" />
          <rect x="20.4" y="-6" width="3.2" height="7" rx="1.4" />
          <path d="M6 14h32l6 7H0z" />
          <rect x="14" y="21" width="16" height="8" rx="1" opacity=".75" />
          <path d="M2 32h40l7 8H-5z" />
          <rect x="10" y="40" width="24" height="10" rx="1" opacity=".75" />
          <path d="M-2 53h48l8 9H-10z" />
          <rect x="6" y="62" width="32" height="16" rx="1" opacity=".6" />
          <rect x="15" y="66" width="14" height="12" rx="6" fill="#0C0C0E" opacity=".5" />
        </g>

        {/* Seigaiha waves */}
        <g stroke="url(#wok-gold-line)" strokeWidth="1.2">
          {[0, 1, 2, 3].map((row) =>
            Array.from({ length: 10 }).map((_, i) => (
              <circle
                key={`${row}-${i}`}
                cx={i * 28 + (row % 2 ? 14 : 0) - 10}
                cy={112 + row * 18}
                r={20 - row * 1.5}
              />
            )),
          )}
          {[0, 1, 2, 3].map((row) =>
            Array.from({ length: 10 }).map((_, i) => (
              <circle
                key={`i-${row}-${i}`}
                cx={i * 28 + (row % 2 ? 14 : 0) - 10}
                cy={112 + row * 18}
                r={12 - row}
              />
            )),
          )}
        </g>
      </svg>
    </div>
  )
}

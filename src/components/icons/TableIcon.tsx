import type { SVGProps } from 'react'

/**
 * Dining-table glyph from the mockups (a table top on two legs). Lucide has no
 * equivalent, so it is drawn here in the same 24px / 2px-stroke system.
 */
export function TableIcon({ strokeWidth = 1.9, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 8h18" />
      <path d="M5 8v11M19 8v11" />
      <path d="M5 13h14" />
      <path d="M8 5v3M16 5v3" />
    </svg>
  )
}

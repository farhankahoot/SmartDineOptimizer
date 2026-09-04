import type { SVGProps } from 'react'

/** Solid funnel used on the "Filter" button — Lucide only ships the outline form. */
export function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M1.6 2.2h12.8a.6.6 0 0 1 .46.99L10 9.1v4.03a.6.6 0 0 1-.87.54l-2.4-1.2a.6.6 0 0 1-.33-.54V9.1L1.14 3.19a.6.6 0 0 1 .46-.99Z" />
    </svg>
  )
}

import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NotificationBell } from './NotificationBell'
import { AccountMenu } from './AccountMenu'

export interface PageHeaderProps {
  title: string
  /** Right-hand action rendered before the bell (e.g. "Add Reservation"). */
  action?: ReactNode

  /** Admin User / Restaurant Admin block — absent on the Reservations mockup. */

  /** Warm patterned banner + dragon watermark (Table Management mockup). */
  banner?: boolean
  /** Short gold rule under the title — Food Deals and Communication mockups. */
  underline?: boolean
  /** Number of leading characters tinted maroon — Table Management mockup ("Ta"). */
  accentPrefix?: number
  /** Only the Communication mockup draws the collapse toggle on desktop. */
  showNavToggle?: boolean
  onToggleNav: () => void
}

export function PageHeader({
  title,
  action,
  banner,
  underline,
  accentPrefix = 0,
  showNavToggle,
  onToggleNav,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'relative shrink-0 border-b border-line',
        banner ? 'banner-cream overflow-hidden' : 'bg-page',
      )}
    >
      {banner && <DragonWatermark />}

      <div className="relative flex items-center gap-3 px-[var(--page-pad-x)] py-4">
        <button
          type="button"
          onClick={onToggleNav}
          aria-label="Toggle navigation"
          className={cn(
            'focus-ring -ml-1 shrink-0 rounded-lg border border-line bg-white p-2 text-ink-soft transition hover:bg-line-soft',
            !showNavToggle && 'lg:hidden',
          )}
        >
          <Menu className="size-[18px]" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-extrabold leading-tight tracking-[-0.015em] text-ink sm:truncate sm:text-[24px] xl:text-[27px]">
            {accentPrefix > 0 && (
              <span className="text-brand-700">{title.slice(0, accentPrefix)}</span>
            )}
            {title.slice(accentPrefix)}
          </h1>
          {underline && (
            <span className="mt-1.5 block h-[3px] w-[86px] rounded-full bg-gold-400" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3.5">
          {/* The page action sits inline from sm; on phones it drops to its own row. */}
          <span className="hidden sm:inline-flex">{action}</span>

          <NotificationBell />

          <AccountMenu />
        </div>
      </div>

      {action && (
        <div className="relative px-[var(--page-pad-x)] pb-3.5 sm:hidden">{action}</div>
      )}
    </header>
  )
}

/** Gold dragon line-art behind the banner variant of the header. */
function DragonWatermark() {
  return (
    <svg
      viewBox="0 0 220 90"
      aria-hidden="true"
      className="pointer-events-none absolute -top-1 right-4 h-[86px] w-[210px] opacity-[0.42]"
      fill="none"
    >
      <path
        d="M6 62c26-6 38-24 62-30 21-5 33 6 52 2 17-3 23-16 41-16 14 0 23 8 25 18-8-6-16-8-24-4-13 6-14 20-31 24-20 5-32-6-52-2C58 58 44 78 12 80"
        stroke="#C8A34A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M172 30c8-4 16-2 20 4M150 40c10 2 18-2 21-9M120 46c9 4 18 2 22-4"
        stroke="#C8A34A"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity=".7"
      />
      <circle cx="196" cy="30" r="2.4" fill="#C8A34A" />
    </svg>
  )
}

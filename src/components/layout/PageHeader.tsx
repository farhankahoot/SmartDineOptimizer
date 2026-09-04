import { useState, type ReactNode } from 'react'
import { Bell, ChevronDown, Menu } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PageHeaderProps {
  title: string
  /** Right-hand action rendered before the bell (e.g. "Add Reservation"). */
  action?: ReactNode
  notificationCount?: number
  /** Admin User / Restaurant Admin block — absent on the Reservations mockup. */
  showProfile?: boolean
  profileName?: string
  profileRole?: string
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
  notificationCount,
  showProfile = true,
  profileName = 'Admin User',
  profileRole = 'Administrator',
  banner,
  underline,
  accentPrefix = 0,
  showNavToggle,
  onToggleNav,
}: PageHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

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

          <button
            type="button"
            aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
            className="focus-ring relative rounded-lg p-1.5 text-brand-700 transition hover:bg-brand-50"
          >
            <Bell className="size-[19px]" strokeWidth={1.9} />
            {!!notificationCount && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-state-dangerSolid px-1 text-[9px] font-bold leading-[15px] text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {showProfile && (
            <div className="relative hidden items-center gap-2.5 border-l border-line pl-3.5 sm:flex">
              <LotusAvatar />
              <div className="leading-tight">
                <p className="text-[12.5px] font-bold text-ink">{profileName}</p>
                <p className="text-[10.5px] text-ink-muted">{profileRole}</p>
              </div>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="focus-ring rounded p-0.5 text-ink-muted transition hover:text-ink"
              >
                <ChevronDown className={cn('size-4 transition', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[168px] animate-scale-in overflow-hidden rounded-[10px] border border-line bg-white py-1 shadow-pop">
                    {['My Profile', 'Preferences', 'Sign out'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="block w-full px-3.5 py-2 text-left text-[12.5px] text-ink-soft transition hover:bg-line-soft"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {action && (
        <div className="relative px-[var(--page-pad-x)] pb-3.5 sm:hidden">{action}</div>
      )}
    </header>
  )
}

/** Maroon disc with the gold lotus emblem used as the admin avatar. */
function LotusAvatar() {
  return (
    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brand-800">
      <svg viewBox="0 0 24 24" className="size-[19px]" fill="#D4A537" aria-hidden="true">
        <path d="M12 4.2c1.5 1.6 2.3 3.4 2.3 5.3 0 1-.2 1.9-.6 2.8-.4-.9-.6-1.8-.6-2.8 0-1.9.8-3.7 2.3-5.3z" opacity=".9" transform="rotate(0 12 12)" />
        <path d="M12 3.4c1.7 1.9 2.6 3.9 2.6 6 0 2-.9 4-2.6 5.9-1.7-1.9-2.6-3.9-2.6-5.9 0-2.1.9-4.1 2.6-6z" />
        <path d="M6.2 6.6c2.3.9 3.9 2.2 4.9 3.9 1 1.7 1.3 3.7 1 6-2.3-.9-3.9-2.2-4.9-3.9-1-1.7-1.3-3.7-1-6z" opacity=".85" />
        <path d="M17.8 6.6c.3 2.3 0 4.3-1 6-1 1.7-2.6 3-4.9 3.9-.3-2.3 0-4.3 1-6 1-1.7 2.6-3 4.9-3.9z" opacity=".85" />
        <path d="M3.6 12.5c2.4-.2 4.3.2 5.8 1.1 1.5.9 2.6 2.4 3.3 4.5-2.4.2-4.3-.2-5.8-1.1-1.5-.9-2.6-2.4-3.3-4.5z" opacity=".7" />
        <path d="M20.4 12.5c-.7 2.1-1.8 3.6-3.3 4.5-1.5.9-3.4 1.3-5.8 1.1.7-2.1 1.8-3.6 3.3-4.5 1.5-.9 3.4-1.3 5.8-1.1z" opacity=".7" />
      </svg>
    </span>
  )
}

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

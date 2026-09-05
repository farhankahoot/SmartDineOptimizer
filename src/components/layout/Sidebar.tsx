import { Link, NavLink } from 'react-router-dom'
import { CalendarDays, LogOut, ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { navItems } from '@/data/nav'
import { useAuth } from '@/auth/AuthContext'
import { roleLabels } from '@/data/users'
import { BrandLogo, GoldDivider } from './BrandLogo'
import { SidebarArt } from './SidebarArt'

/**
 * The sidebar's date badge. Read once per page load rather than per render —
 * a console left open overnight is refreshed by the next navigation, and this
 * avoids re-formatting on every state change.
 */
const today = new Date()
const todayLabel = today.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const weekdayLabel = today.toLocaleDateString('en-GB', { weekday: 'long' })

export function Sidebar({
  mobileOpen,
  collapsed,
  onCloseMobile,
}: {
  mobileOpen: boolean
  collapsed: boolean
  onCloseMobile: () => void
}) {
  const { user, allows, signOut } = useAuth()

  // Module 8 FE-3 — only surface modules this role is allowed to open.
  const visibleItems = navItems.filter((i) => allows(i.permission))

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/45 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'sidebar-fill fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden',
          'w-[var(--sidebar-w)] transition-[width] duration-200',
          'lg:static lg:z-auto lg:translate-x-0',
          collapsed && 'lg:w-[var(--sidebar-w-collapsed)]',
          mobileOpen ? 'animate-slide-in-left' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="focus-ring absolute right-3 top-3 z-10 rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
        >
          <X className="size-[18px]" />
        </button>

        <div className="flex justify-center pb-3 pt-6">
          <BrandLogo scale={collapsed ? 0.42 : 1} className="lg:transition-all" />
        </div>
        <GoldDivider className={cn('pb-4', collapsed && 'lg:px-2')} />

        <nav className="relative z-10 flex flex-col gap-1 overflow-y-auto px-3 no-scrollbar">
          {visibleItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-[8px] px-3 py-[10px] text-[13.5px] font-semibold transition',
                  collapsed && 'lg:justify-center lg:px-0',
                  isActive
                    ? 'brand-fill-bright text-white shadow-navActive'
                    : 'text-white/85 hover:bg-white/[0.07] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-1.5 -left-[3px] w-[3px] rounded-full bg-gold-400" />
                  )}
                  <Icon
                    className={cn('size-[18px] shrink-0', isActive ? 'text-white' : 'text-white/80')}
                    strokeWidth={1.9}
                  />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative flex-1">{!collapsed && <SidebarArt />}</div>

        {/* Platform tier — only visible to a super admin */}
        {allows('view:platform') && (
          <div className="relative z-10 px-3 pb-1">
            <Link
              to="/superadmin"
              onClick={onCloseMobile}
              title={collapsed ? 'Control Centre' : undefined}
              className={cn(
                'focus-ring flex items-center gap-2.5 rounded-[8px] border border-gold-600/45 px-3 py-2.5 text-[12.5px] font-semibold text-gold-300 transition hover:bg-gold-600/10',
                collapsed && 'lg:justify-center lg:px-0',
              )}
            >
              <ShieldCheck className="size-[16px] shrink-0" strokeWidth={2} />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>Control Centre</span>
            </Link>
          </div>
        )}

        {/* Signed-in identity + sign out (Module 8 FE-1) */}
        <div className="relative z-10 border-t border-white/10 px-3 pt-3">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-[10px] px-2 py-2',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-gold-300">
              {(user?.name ?? 'A')
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div className={cn('min-w-0 flex-1 leading-tight', collapsed && 'lg:hidden')}>
              <p className="truncate text-[12px] font-bold text-white">{user?.name ?? 'Admin'}</p>
              <p className="truncate text-[10.5px] text-white/60">
                {user ? roleLabels[user.role] : 'Administrator'}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className={cn(
                'focus-ring shrink-0 rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white',
                collapsed && 'lg:hidden',
              )}
            >
              <LogOut className="size-[15px]" />
            </button>
          </div>
        </div>

        {/* Today's date card pinned to the sidebar footer */}
        <div className="relative z-10 p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-[10px] border border-gold-600/45 bg-white/[0.03] px-3 py-2.5',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <CalendarDays className="size-[19px] shrink-0 text-gold-400" strokeWidth={1.8} />
            <div className={cn('min-w-0 leading-tight', collapsed && 'lg:hidden')}>
              <p className="text-[11px] font-bold text-gold-400">Today&apos;s Date</p>
              <p className="text-[12.5px] font-semibold text-white">{todayLabel}</p>
              <p className="text-[11px] text-white/70">{weekdayLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

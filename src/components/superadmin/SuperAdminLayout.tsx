import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowLeft, LogOut, ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { superAdminNav } from '@/data/superAdminNav'
import { roleLabels } from '@/data/users'
import { useAuth } from '@/auth/AuthContext'
import { usePlatform } from '@/store/PlatformContext'
import { MobileNavContext } from '@/components/layout/useMobileNav'

/** Control-centre shell: same visual language as the console, different nav. */
export function SuperAdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut, allows } = useAuth()
  const { unreadCount } = usePlatform()

  const groups = superAdminNav
    .map((g) => ({ ...g, items: g.items.filter((i) => allows(i.permission)) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="flex h-full bg-page">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'sidebar-fill fixed inset-y-0 left-0 z-50 flex w-[254px] flex-col overflow-hidden',
          'lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'animate-slide-in-left' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="focus-ring absolute right-3 top-3 z-10 rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
        >
          <X className="size-[18px]" />
        </button>

        <div className="flex flex-col items-center gap-2.5 border-b border-white/10 px-4 pb-4 pt-6">
          <BrandLogo scale={0.82} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-600/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gold-300">
            <ShieldCheck className="size-[12px]" />
            Control Centre
          </span>
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
          {groups.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-white/35">
                {group.title}
              </p>
              <ul className="grid gap-0.5">
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-2.5 rounded-[8px] px-3 py-[9px] text-[13px] font-semibold transition',
                          isActive
                            ? 'brand-fill-bright text-white shadow-navActive'
                            : 'text-white/80 hover:bg-white/[0.07] hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute inset-y-1.5 -left-[3px] w-[3px] rounded-full bg-gold-400" />
                          )}
                          <Icon className="size-[17px] shrink-0" strokeWidth={1.9} />
                          <span className="truncate">{label}</span>
                          {label === 'Notifications' && unreadCount > 0 && (
                            <span className="ml-auto flex min-w-[18px] items-center justify-center rounded-full bg-state-dangerSolid px-1 text-[9.5px] font-bold leading-[16px] text-white">
                              {unreadCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="relative z-10 border-t border-white/10 p-3">
          <Link
            to="/admin"
            className="focus-ring mb-2 flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[12.5px] font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft className="size-[15px] shrink-0" />
            Back to restaurant console
          </Link>

          <div className="flex items-center gap-2.5 rounded-[10px] border border-gold-600/35 bg-white/[0.03] px-3 py-2.5">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-gold-300">
              {(user?.name ?? 'S')
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[12px] font-bold text-white">{user?.name ?? 'Super Admin'}</p>
              <p className="truncate text-[10.5px] text-gold-400">
                {user ? roleLabels[user.role] : 'Super Admin'}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="focus-ring shrink-0 rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-[15px]" />
            </button>
          </div>
        </div>
      </aside>

      <div data-scroll-root className="min-w-0 flex-1 overflow-y-auto">
        <MobileNavContext.Provider
          value={{ toggle: () => setMobileOpen(true), collapsed: false }}
        >
          <Outlet />
        </MobileNavContext.Provider>
      </div>
    </div>
  )
}

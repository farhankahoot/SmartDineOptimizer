import { useCallback, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNavContext } from './useMobileNav'

const DESKTOP = '(min-width: 1024px)'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // One header button: it opens the drawer on phones and collapses the rail on
  // desktop, matching the hamburger drawn in the Communication mockup.
  const toggle = useCallback(() => {
    if (window.matchMedia(DESKTOP).matches) setCollapsed((v) => !v)
    else setMobileOpen(true)
  }, [])

  const controls = useMemo(() => ({ toggle, collapsed }), [toggle, collapsed])

  return (
    <div className="flex h-full bg-page">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div data-scroll-root className="min-w-0 flex-1 overflow-y-auto">
        <MobileNavContext.Provider value={controls}>
          <Outlet />
        </MobileNavContext.Provider>
      </div>
    </div>
  )
}

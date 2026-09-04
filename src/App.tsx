import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequirePermission } from '@/auth/RequireAuth'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

import { LandingPage } from '@/pages/public/LandingPage'
import { PublicReservationPage } from '@/pages/public/PublicReservationPage'
import { TrackReservationPage } from '@/pages/public/TrackReservationPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { BookingGate, MaintenanceGate, TrackingGate } from '@/pages/public/PublicGate'

import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

/**
 * The console and its charting library are code-split away from the public
 * site, so a visitor landing on the marketing page never downloads them.
 */
function page<T>(loader: () => Promise<T>, name: keyof T) {
  return lazy(() => loader().then((m) => ({ default: m[name] as ComponentType })))
}

const AdminLayout = page(() => import('@/components/layout/AdminLayout'), 'AdminLayout')
const DashboardPage = page(() => import('@/pages/admin/DashboardPage'), 'DashboardPage')
const ReservationsPage = page(() => import('@/pages/admin/ReservationsPage'), 'ReservationsPage')
const ReservationDetailPage = page(
  () => import('@/pages/admin/ReservationDetailPage'),
  'ReservationDetailPage',
)
const TableManagementPage = page(
  () => import('@/pages/admin/TableManagementPage'),
  'TableManagementPage',
)
const TimeSlotsPage = page(() => import('@/pages/admin/TimeSlotsPage'), 'TimeSlotsPage')
const FoodDealsPage = page(() => import('@/pages/admin/FoodDealsPage'), 'FoodDealsPage')
const StaffPage = page(() => import('@/pages/admin/StaffPage'), 'StaffPage')
const CommunicationPage = page(() => import('@/pages/admin/CommunicationPage'), 'CommunicationPage')
const PredictionPage = page(() => import('@/pages/admin/PredictionPage'), 'PredictionPage')
const ReportsPage = page(() => import('@/pages/admin/ReportsPage'), 'ReportsPage')
const SettingsPage = page(() => import('@/pages/admin/SettingsPage'), 'SettingsPage')

/* ------------------------------------------------ super admin control centre */
const SuperAdminLayout = page(
  () => import('@/components/superadmin/SuperAdminLayout'),
  'SuperAdminLayout',
)
const SuperOverviewPage = page(() => import('@/pages/superadmin/OverviewPage'), 'SuperOverviewPage')
const PlatformUsersPage = page(
  () => import('@/pages/superadmin/PlatformUsersPage'),
  'PlatformUsersPage',
)
const RolesPage = page(() => import('@/pages/superadmin/RolesPage'), 'RolesPage')
const RestaurantsPage = page(() => import('@/pages/superadmin/RestaurantsPage'), 'RestaurantsPage')
const ShowcasePage = page(() => import('@/pages/superadmin/ShowcasePage'), 'ShowcasePage')
const ContentPage = page(() => import('@/pages/superadmin/ContentPage'), 'ContentPage')
const SystemPage = page(() => import('@/pages/superadmin/SystemPage'), 'SystemPage')
const HealthPage = page(() => import('@/pages/superadmin/HealthPage'), 'HealthPage')
const SecurityPage = page(() => import('@/pages/superadmin/SecurityPage'), 'SecurityPage')
const AuditPage = page(() => import('@/pages/superadmin/AuditPage'), 'AuditPage')
const SuperNotificationsPage = page(
  () => import('@/pages/superadmin/NotificationsPage'),
  'NotificationsPage',
)

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full place-items-center p-10 text-[13px] text-ink-muted">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/** Wraps a lazily-loaded admin screen in its Suspense boundary. */
const lazyRoute = (Component: ComponentType) => (
  <Lazy>
    <Component />
  </Lazy>
)

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* ---------------------------------------------- guest-facing */}
      <Route element={<MaintenanceGate />}>
        <Route path="/" element={<LandingPage />} />
        <Route element={<BookingGate />}>
          <Route path="/reserve" element={<PublicReservationPage />} />
        </Route>
        <Route element={<TrackingGate />}>
          <Route path="/track" element={<TrackReservationPage />} />
        </Route>
      </Route>

      {/* ---------------------------------------------- authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ---------------------------------------------- admin console */}
      <Route element={<RequireAuth />}>
        <Route path="/admin" element={lazyRoute(AdminLayout)}>
          <Route index element={lazyRoute(DashboardPage)} />

          <Route element={<RequirePermission permission="view:reservations" />}>
            <Route path="reservations" element={lazyRoute(ReservationsPage)} />
            <Route path="reservations/:id" element={lazyRoute(ReservationDetailPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:tables" />}>
            <Route path="tables" element={lazyRoute(TableManagementPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:slots" />}>
            <Route path="time-slots" element={lazyRoute(TimeSlotsPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:deals" />}>
            <Route path="food-deals" element={lazyRoute(FoodDealsPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:staff" />}>
            <Route path="staff" element={lazyRoute(StaffPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:communication" />}>
            <Route path="communication" element={lazyRoute(CommunicationPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:prediction" />}>
            <Route path="prediction" element={lazyRoute(PredictionPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:reports" />}>
            <Route path="reports" element={lazyRoute(ReportsPage)} />
          </Route>

          <Route element={<RequirePermission permission="view:settings" />}>
            <Route path="settings" element={lazyRoute(SettingsPage)} />
          </Route>
        </Route>
      </Route>

      {/* ------------------------------------ super admin control centre */}
      <Route element={<RequireAuth />}>
        <Route element={<RequirePermission permission="view:platform" mode="forbid" />}>
          <Route path="/superadmin" element={lazyRoute(SuperAdminLayout)}>
            <Route index element={lazyRoute(SuperOverviewPage)} />
            <Route path="notifications" element={lazyRoute(SuperNotificationsPage)} />

            <Route element={<RequirePermission permission="manage:platform-users" mode="forbid" />}>
              <Route path="users" element={lazyRoute(PlatformUsersPage)} />
            </Route>
            <Route element={<RequirePermission permission="manage:roles" mode="forbid" />}>
              <Route path="roles" element={lazyRoute(RolesPage)} />
            </Route>
            <Route element={<RequirePermission permission="manage:restaurants" mode="forbid" />}>
              <Route path="restaurants" element={lazyRoute(RestaurantsPage)} />
            </Route>
            <Route element={<RequirePermission permission="manage:showcase" mode="forbid" />}>
              <Route path="showcase" element={lazyRoute(ShowcasePage)} />
            </Route>
            <Route element={<RequirePermission permission="manage:content" mode="forbid" />}>
              <Route path="content" element={lazyRoute(ContentPage)} />
            </Route>
            <Route element={<RequirePermission permission="manage:system" mode="forbid" />}>
              <Route path="system" element={lazyRoute(SystemPage)} />
            </Route>
            <Route element={<RequirePermission permission="view:health" mode="forbid" />}>
              <Route path="health" element={lazyRoute(HealthPage)} />
            </Route>
            <Route element={<RequirePermission permission="manage:security" mode="forbid" />}>
              <Route path="security" element={lazyRoute(SecurityPage)} />
            </Route>
            <Route element={<RequirePermission permission="view:audit" mode="forbid" />}>
              <Route path="audit" element={lazyRoute(AuditPage)} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

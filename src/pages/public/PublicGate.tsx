import { Navigate, Outlet } from 'react-router-dom'
import { useSystem } from '@/store/SystemContext'
import { MaintenancePage } from './MaintenancePage'

/** Guest routes fall behind the maintenance notice when an admin enables it. */
export function MaintenanceGate() {
  const { system } = useSystem()
  if (system.maintenanceMode) return <MaintenancePage />
  return <Outlet />
}

/** The booking form can be closed on its own without a full maintenance window. */
export function BookingGate() {
  const { system } = useSystem()
  if (!system.publicBookingEnabled) return <Navigate to="/" replace />
  return <Outlet />
}

/** The guest status tracker can likewise be switched off. */
export function TrackingGate() {
  const { system } = useSystem()
  if (!system.trackingEnabled) return <Navigate to="/" replace />
  return <Outlet />
}

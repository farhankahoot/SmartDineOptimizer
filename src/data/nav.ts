import {
  CalendarDays,
  Clock,
  FileText,
  LayoutGrid,
  LineChart,
  MessageSquare,
  Settings,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import type { Permission } from '@/data/users'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon | typeof TableIcon
  end?: boolean
  /** Module 8 FE-3 — the entry is hidden when the role lacks this permission. */
  permission: Permission
}

/**
 * The eight entries drawn in the sidebar mockups, plus the two modules the PDF
 * requires that the mockups never gave a nav slot: Staff (Module 4 FE-4..6) and
 * Communication (Module 8 FE-5..8).
 */
export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutGrid, end: true, permission: 'view:dashboard' },
  { label: 'Reservations', to: '/admin/reservations', icon: CalendarDays, permission: 'view:reservations' },
  { label: 'Table Management', to: '/admin/tables', icon: TableIcon, permission: 'view:tables' },
  { label: 'Time Slots', to: '/admin/time-slots', icon: Clock, permission: 'view:slots' },
  { label: 'Food Deals', to: '/admin/food-deals', icon: Tag, permission: 'view:deals' },
  { label: 'Staff', to: '/admin/staff', icon: Users, permission: 'view:staff' },
  { label: 'Communication', to: '/admin/communication', icon: MessageSquare, permission: 'view:communication' },
  { label: 'Prediction Dashboard', to: '/admin/prediction', icon: LineChart, permission: 'view:prediction' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, permission: 'view:reports' },
  { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'view:settings' },
]

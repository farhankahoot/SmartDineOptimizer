import {
  Activity,
  Bell,
  FileText,
  Gauge,
  Images,
  LayoutGrid,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/data/users'

export interface SuperNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  permission: Permission
}

export interface SuperNavGroup {
  title: string
  items: SuperNavItem[]
}

/** Grouped navigation for the platform control centre. */
export const superAdminNav: SuperNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Control Centre', to: '/superadmin', icon: LayoutGrid, end: true, permission: 'view:platform' },
      { label: 'Notifications', to: '/superadmin/notifications', icon: Bell, permission: 'view:platform' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Users', to: '/superadmin/users', icon: Users, permission: 'manage:platform-users' },
      { label: 'Roles & Permissions', to: '/superadmin/roles', icon: ShieldCheck, permission: 'manage:roles' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Landing Page', to: '/superadmin/content', icon: Images, permission: 'manage:content' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'System Controls', to: '/superadmin/system', icon: SlidersHorizontal, permission: 'manage:system' },
      { label: 'System Health', to: '/superadmin/health', icon: Gauge, permission: 'view:health' },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Security', to: '/superadmin/security', icon: Activity, permission: 'manage:security' },
      { label: 'Audit Log', to: '/superadmin/audit', icon: FileText, permission: 'view:audit' },
    ],
  },
]

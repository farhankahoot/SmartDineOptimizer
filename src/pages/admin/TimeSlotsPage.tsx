import { Clock } from 'lucide-react'
import { TableIcon } from '@/components/icons/TableIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { tableStats } from '@/data/tables'
import { TimeSlotModule } from './TimeSlotModule'

/**
 * Standalone route for the sidebar's "Time Slots" entry. It reuses the exact
 * module rendered inside the Table Management mockup rather than a new design.
 */
export function TimeSlotsPage() {
  const { toggle } = useMobileNav()
  const stats = tableStats.filter((s) => ['total', 'available', 'slots'].includes(s.key))

  return (
    <>
      <PageHeader
        title="Time Slot Management"
        accentPrefix={2}
        banner
        showProfile={false}
        notificationCount={5}
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s, i) => (
            <StatCard
              key={s.key}
              variant="circleUp"
              color={s.color}
              icon={[<TableIcon key="a" />, <TableIcon key="b" />, <Clock key="c" />][i]}
              label={s.label}
              value={s.value}
              caption={s.caption}
            />
          ))}
        </section>

        <TimeSlotModule standalone />
      </div>
    </>
  )
}

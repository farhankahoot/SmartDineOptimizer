import { Fragment } from 'react'
import { Check, Minus, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { useUsers } from '@/store/UsersContext'
import {
  allPermissions,
  can,
  permissionLabels,
  roleDescriptions,
  roleLabels,
  type Permission,
  type Role,
} from '@/data/users'

const roles = Object.keys(roleLabels) as Role[]

/** Groups the permission matrix by product area for readability. */
const groups: { title: string; match: (p: Permission) => boolean }[] = [
  { title: 'Reservations & service', match: (p) => /reservations|dashboard|tables|slots|deals/.test(p) },
  { title: 'People & messaging', match: (p) => /staff|communication|users/.test(p) },
  { title: 'Analytics & settings', match: (p) => /prediction|reports|settings/.test(p) },
  { title: 'Platform control', match: (p) => /platform|roles|content|system|features|health|security|audit/.test(p) },
]

export function RolesPage() {
  const { toggle } = useMobileNav()
  const { users } = useUsers()

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        underline
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <div className="flex items-start gap-2.5 rounded-[10px] border border-line bg-white px-4 py-3">
          <ShieldCheck className="mt-px size-[17px] shrink-0 text-brand-700" />
          <p className="text-[12.5px] text-ink-soft">
            Roles are fixed in code so permissions cannot drift between the client and a future
            server. Assign a user to a different role from{' '}
            <strong>Users</strong>; the matrix below is the contract both sides enforce.
          </p>
        </div>

        {/* Role cards */}
        <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => {
            const count = users.filter((u) => u.role === role).length
            const granted = allPermissions.filter((p) => can(role, p)).length
            return (
              <Card key={role} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[14.5px] font-bold text-ink">{roleLabels[role]}</h2>
                  <Badge tone={role === 'superadmin' ? 'selected' : 'neutral'}>
                    {count} user{count === 1 ? '' : 's'}
                  </Badge>
                </div>
                <p className="mt-2 min-h-[52px] text-[12px] leading-relaxed text-ink-muted">
                  {roleDescriptions[role]}
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <Users className="size-[14px] text-ink-faint" />
                  <span className="text-[11.5px] text-ink-soft">
                    <strong className="text-ink">{granted}</strong> of {allPermissions.length}{' '}
                    permissions
                  </span>
                </div>
              </Card>
            )
          })}
        </section>

        {/* Matrix */}
        <Card className="overflow-hidden">
          <div className="px-4 pb-3 pt-4">
            <SectionTitle icon={<ShieldCheck className="size-[16px]" strokeWidth={2.3} />}>
              Permission Matrix
            </SectionTitle>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              A tick means the role can reach that capability; the console hides the control
              entirely when it cannot.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Permissions granted to each role</caption>
              <thead>
                <tr className="border-y border-line bg-[#FAF6F0]">
                  <th scope="col" className="px-4 py-3 text-[12px] font-bold text-ink">
                    Capability
                  </th>
                  {roles.map((r) => (
                    <th
                      key={r}
                      scope="col"
                      className="px-4 py-3 text-center text-[12px] font-bold text-ink"
                    >
                      {roleLabels[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const rows = allPermissions.filter(group.match)
                  if (rows.length === 0) return null
                  return (
                    <Fragment key={group.title}>
                      <tr className="bg-[#FBF9F7]">
                        <th
                          scope="colgroup"
                          colSpan={roles.length + 1}
                          className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-brand-700"
                        >
                          {group.title}
                        </th>
                      </tr>
                      {rows.map((p) => (
                        <tr key={p} className="border-b border-line-soft last:border-0">
                          <td className="px-4 py-2.5 text-[12.5px] text-ink-soft">
                            {permissionLabels[p]}
                          </td>
                          {roles.map((r) => (
                            <td key={r} className="px-4 py-2.5 text-center">
                              {can(r, p) ? (
                                <Check
                                  className="mx-auto size-[15px] text-state-success"
                                  aria-label={`${roleLabels[r]} can ${permissionLabels[p]}`}
                                />
                              ) : (
                                <Minus
                                  className="mx-auto size-[15px] text-ink-faint"
                                  aria-label={`${roleLabels[r]} cannot ${permissionLabels[p]}`}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={cn('border-t border-line bg-[#FBF9F7] px-4 py-3')}>
            <p className="text-[11.5px] text-ink-muted">
              <strong className="text-ink">Backend note:</strong> the client hides what a role
              cannot reach, but a server must re-check every permission on{' '}
              <code className="rounded bg-white px-1">PATCH /admin/users/:id/role</code> and on each
              protected endpoint. Client-side gating alone is not authorisation.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}

import { useMemo, useState, type FormEvent } from 'react'
import { KeyRound, Mail, Plus, Search, ShieldOff, Trash2, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { useUsers } from '@/store/UsersContext'
import { usePlatform } from '@/store/PlatformContext'
import { roleLabels, type Role, type SystemUser, type UserStatus } from '@/data/users'

const statusTone: Record<UserStatus, BadgeTone> = {
  Active: 'confirmed',
  Invited: 'pending',
  Suspended: 'cancelled',
}

/** Platform-wide account administration. */
export function PlatformUsersPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { user } = useAuth()
  const { users, invite, setRole, setStatus, remove } = useUsers()
  const { log } = usePlatform()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sort, setSort] = useState<'name' | 'role' | 'status'>('name')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', role: 'staff' as Role })
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const [blocking, setBlocking] = useState<SystemUser | null>(null)
  const [reason, setReason] = useState('')
  const [removing, setRemoving] = useState<SystemUser | null>(null)
  const [detail, setDetail] = useState<SystemUser | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter(
        (u) =>
          (roleFilter === 'All roles' || roleLabels[u.role] === roleFilter) &&
          (statusFilter === 'All statuses' || u.status === statusFilter) &&
          (q === '' ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.phone.includes(q)),
      )
      .sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : sort === 'role'
            ? a.role.localeCompare(b.role)
            : a.status.localeCompare(b.status),
      )
  }, [users, search, roleFilter, statusFilter, sort])

  const dirty = search !== '' || roleFilter !== 'All roles' || statusFilter !== 'All statuses'

  const sendInvite = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!draft.name.trim()) next.name = 'Name is required.'
    if (!draft.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
      next.email = 'Enter a valid email address.'
    else if (users.some((u) => u.email.toLowerCase() === draft.email.trim().toLowerCase()))
      next.email = 'A user with this email already exists.'
    setErrors(next)
    if (Object.keys(next).length) return

    invite({ name: draft.name.trim(), email: draft.email.trim(), role: draft.role })
    log({ action: 'Invited user', target: draft.email.trim(), category: 'User' })
    push({ tone: 'success', title: 'Invitation sent', detail: draft.email.trim() })
    setDraft({ name: '', email: '', role: 'staff' })
    setInviteOpen(false)
  }

  const columns: Column<SystemUser>[] = [
    {
      key: 'name',
      header: 'User',
      className: 'font-semibold text-ink',
      render: (u) => (
        <button
          type="button"
          onClick={() => setDetail(u)}
          className="focus-ring rounded text-left hover:text-brand-700 hover:underline"
        >
          {u.name}
          {u.id === user?.id && <span className="ml-1.5 text-[10px] text-ink-faint">(you)</span>}
        </button>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'phone', header: 'Phone', render: (u) => u.phone },
    {
      key: 'role',
      header: 'Role',
      align: 'center',
      render: (u) =>
        u.id === user?.id ? (
          <Badge tone="neutral">{roleLabels[u.role]}</Badge>
        ) : (
          <Select
            aria-label={`Role for ${u.name}`}
            value={u.role}
            className="h-[30px] w-[132px] text-xs"
            onChange={(e) => {
              const role = e.target.value as Role
              setRole(u.id, role)
              log({ action: `Changed role to ${roleLabels[role]}`, target: u.email, category: 'User' })
              push({ tone: 'success', title: 'Role updated', detail: `${u.name} → ${roleLabels[role]}` })
            }}
            options={(Object.keys(roleLabels) as Role[]).map((r) => ({ value: r, label: roleLabels[r] }))}
          />
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (u) => <Badge tone={statusTone[u.status]}>{u.status}</Badge>,
    },
    { key: 'active', header: 'Last Active', render: (u) => u.lastActive },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[230px]',
      render: (u) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="xs"
            variant="outlineNeutral"
            leftIcon={<KeyRound className="size-[11px]" />}
            disabled={u.status === 'Invited'}
            onClick={() => {
              log({ action: 'Triggered password reset', target: u.email, category: 'Security' })
              push({ tone: 'success', title: 'Reset link sent', detail: u.email })
            }}
          >
            Reset
          </Button>
          {u.status === 'Suspended' ? (
            <Button
              size="xs"
              variant="outlineSuccess"
              leftIcon={<UserCheck className="size-[11px]" />}
              onClick={() => {
                setStatus(u.id, 'Active')
                log({ action: 'Unblocked account', target: u.email, category: 'User' })
                push({ tone: 'success', title: `${u.name} unblocked` })
              }}
            >
              Unblock
            </Button>
          ) : (
            <Button
              size="xs"
              variant="outlineDanger"
              leftIcon={<ShieldOff className="size-[11px]" />}
              disabled={u.id === user?.id}
              onClick={() => {
                setBlocking(u)
                setReason('')
              }}
            >
              Block
            </Button>
          )}
          <Button
            size="xs"
            variant="outlineDanger"
            leftIcon={<Trash2 className="size-[11px]" />}
            disabled={u.id === user?.id}
            onClick={() => setRemoving(u)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Users"
        underline
        onToggleNav={toggle}
        action={
          <Button leftIcon={<Plus className="size-[15px]" />} onClick={() => setInviteOpen(true)}>
            Invite User
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard variant="circleUp" color="#7A1113" icon={<UserCheck />} label="Total Users" value={String(users.length)} caption="All console accounts" />
          <StatCard variant="circleUp" color="#2E7D32" icon={<UserCheck />} label="Active" value={String(users.filter((u) => u.status === 'Active').length)} caption="Can sign in" />
          <StatCard variant="circleUp" color="#C99A3E" icon={<Mail />} label="Invited" value={String(users.filter((u) => u.status === 'Invited').length)} caption="Not yet accepted" />
          <StatCard variant="circleUp" color="#C0392B" icon={<ShieldOff />} label="Blocked" value={String(users.filter((u) => u.status === 'Suspended').length)} caption="Refused at sign-in" />
        </section>

        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="u-search">Search</Label>
              <Input
                id="u-search"
                trailing={<Search />}
                placeholder="Name, email or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="u-role">Role</Label>
              <Select
                id="u-role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={['All roles', ...Object.values(roleLabels)].map((r) => ({ value: r, label: r }))}
              />
            </div>
            <div>
              <Label htmlFor="u-status">Status</Label>
              <Select
                id="u-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={['All statuses', 'Active', 'Invited', 'Suspended'].map((r) => ({ value: r, label: r }))}
              />
            </div>
            <div>
              <Label htmlFor="u-sort">Sort by</Label>
              <Select
                id="u-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                options={[
                  { value: 'name', label: 'Name' },
                  { value: 'role', label: 'Role' },
                  { value: 'status', label: 'Status' },
                ]}
              />
            </div>
          </div>

          <div className="mt-3.5 overflow-hidden rounded-[10px] border border-line">
            {filtered.length === 0 ? (
              <EmptyState
                title="No users match these filters"
                detail="Try a different role, status or search term."
                action={
                  dirty ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setRoleFilter('All roles')
                        setStatusFilter('All statuses')
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DataTable columns={columns} rows={filtered} rowKey={(u) => u.id} minWidth={1080} />
            )}
          </div>
        </Card>
      </div>

      {/* Invite */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a user"
        subtitle="They receive an email to set a password and join the console."
        width="max-w-[460px]"
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="pu-invite">
              Send invitation
            </Button>
          </>
        }
      >
        <form id="pu-invite" noValidate onSubmit={sendInvite} className="grid gap-3.5">
          <div>
            <Label htmlFor="pu-name" required>
              Full name
            </Label>
            <Input
              id="pu-name"
              value={draft.name}
              error={errors.name}
              onChange={(e) => {
                setDraft((d) => ({ ...d, name: e.target.value }))
                setErrors((x) => ({ ...x, name: undefined }))
              }}
            />
            <FieldError>{errors.name}</FieldError>
          </div>
          <div>
            <Label htmlFor="pu-email" required>
              Email address
            </Label>
            <Input
              id="pu-email"
              icon={<Mail />}
              value={draft.email}
              error={errors.email}
              onChange={(e) => {
                setDraft((d) => ({ ...d, email: e.target.value }))
                setErrors((x) => ({ ...x, email: undefined }))
              }}
            />
            <FieldError>{errors.email}</FieldError>
          </div>
          <div>
            <Label htmlFor="pu-role" required>
              Role
            </Label>
            <Select
              id="pu-role"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as Role }))}
              options={(Object.keys(roleLabels) as Role[]).map((r) => ({ value: r, label: roleLabels[r] }))}
            />
          </div>
        </form>
      </Modal>

      {/* Block with reason */}
      <Modal
        open={blocking !== null}
        onClose={() => setBlocking(null)}
        title={`Block ${blocking?.name ?? ''}?`}
        subtitle="They will be refused at the sign-in screen until unblocked."
        width="max-w-[460px]"
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setBlocking(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (blocking) {
                  setStatus(blocking.id, 'Suspended')
                  log({
                    action: 'Blocked account',
                    target: `${blocking.email}${reason.trim() ? ` — ${reason.trim()}` : ''}`,
                    category: 'User',
                  })
                  push({ tone: 'warning', title: `${blocking.name} blocked`, detail: 'They can no longer sign in.' })
                }
                setBlocking(null)
              }}
            >
              Block account
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <p className="text-[13px] text-ink-soft">
            Blocking is reversible. The reason is written to the audit log.
          </p>
          <div>
            <Label htmlFor="pu-reason" hint="(recorded in the audit log)">
              Reason
            </Label>
            <Textarea
              id="pu-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Left the company"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Delete this user?"
        message={`${removing?.name ?? ''} will be removed permanently and lose access immediately. Consider blocking instead if this may be temporary.`}
        confirmLabel="Delete user"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            remove(removing.id)
            log({ action: 'Deleted account', target: removing.email, category: 'User' })
            push({ tone: 'info', title: 'User deleted', detail: removing.name })
          }
          setRemoving(null)
        }}
      />

      {/* Detail */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? roleLabels[detail.role] : undefined}
        width="max-w-[460px]"
        footer={
          <Button variant="outlineNeutral" size="sm" onClick={() => setDetail(null)}>
            Close
          </Button>
        }
      >
        {detail && (
          <dl className="grid gap-3 text-[13px]">
            {[
              ['User ID', detail.id],
              ['Email', detail.email],
              ['Phone', detail.phone],
              ['Role', roleLabels[detail.role]],
              ['Status', detail.status],
              ['Last active', detail.lastActive],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line-soft pb-2 last:border-0">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="font-semibold text-ink">{v}</dd>
              </div>
            ))}
            <p className="mt-1 rounded-[8px] bg-[#FBF9F7] px-3 py-2 text-[11.5px] text-ink-muted">
              Passwords and credentials are never shown in the console.
            </p>
          </dl>
        )}
      </Modal>
    </>
  )
}

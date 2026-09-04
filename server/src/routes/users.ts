/**
 * Module 8 FE-2/FE-3/FE-4 — console user management.
 *
 * Passwords are never returned, never accepted in a create call, and never
 * logged. A new account is invited and sets its own password via the reset
 * flow, so no plaintext credential ever exists on the server.
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit, notifyAdmins } from '../lib/audit.js'
import { hashPassword, hashToken, randomToken, revokeAllSessions } from '../lib/auth.js'
import { badRequest, conflict, forbidden, notFound, parse, route } from '../lib/http.js'
import { sendMessage } from '../lib/mailer.js'
import { permissionsFor, roleLabels, roles, type Role } from '../lib/permissions.js'
import { requirePermission } from '../middleware/auth.js'
import { publicUser } from './auth.js'

export const usersRouter = Router()

const manage = requirePermission('manage:users')

usersRouter.get(
  '/',
  manage,
  route(async (req, res) => {
    const q = parse(
      z.object({
        role: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
      req.query,
    )

    const rows = await prisma.user.findMany({
      where: {
        ...(q.role && !q.role.startsWith('All') ? { role: q.role } : {}),
        ...(q.status && !q.status.startsWith('All') ? { status: q.status } : {}),
        ...(q.search
          ? {
              OR: [
                { name: { contains: q.search.trim() } },
                { email: { contains: q.search.trim() } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ users: rows.map(publicUser) })
  }),
)

/** The role matrix the Roles screen renders. */
usersRouter.get(
  '/roles',
  manage,
  route(async (_req, res) => {
    const counts = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } })
    res.json({
      roles: roles.map((role) => ({
        role,
        label: roleLabels[role],
        permissions: permissionsFor(role),
        userCount: counts.find((c) => c.role === role)?._count._all ?? 0,
      })),
    })
  }),
)

const userSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().min(7, 'Enter a contact number.').default('—'),
  role: z.enum(['superadmin', 'admin', 'manager', 'staff']),
})

/** Invites a user. No password is set here — they choose their own. */
usersRouter.post(
  '/',
  manage,
  route(async (req, res) => {
    const input = parse(userSchema, req.body)
    assertCanTargetRole(req.user!.role, input.role)

    const clash = await prisma.user.findUnique({ where: { email: input.email } })
    if (clash) throw conflict('That email already has an account.', { email: 'Already in use.' })

    const created = await prisma.user.create({
      data: {
        ...input,
        // A random unusable secret: the account cannot be signed into until the
        // invitation is accepted through the reset flow.
        passwordHash: await hashPassword(randomToken()),
        status: 'Invited',
      },
    })

    await sendInvitation(created)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Invited user', target: created.email, category: 'User' })
    await notifyAdmins({
      tone: 'info',
      title: 'New user invitation pending',
      detail: `${created.email} has not accepted their invitation yet.`,
      link: '/superadmin/users',
    })

    res.status(201).json({ user: publicUser(created) })
  }),
)

usersRouter.patch(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('User not found.')

    const input = parse(userSchema.partial(), req.body)
    assertCanTargetRole(req.user!.role, existing.role as Role)
    if (input.role) assertCanTargetRole(req.user!.role, input.role)

    // Removing the last super admin would lock everyone out of the platform.
    if (input.role && existing.role === 'superadmin' && input.role !== 'superadmin') {
      await assertNotLastSuperAdmin(existing.id)
    }

    if (input.email && input.email !== existing.email) {
      const clash = await prisma.user.findUnique({ where: { email: input.email } })
      if (clash) throw conflict('That email already has an account.', { email: 'Already in use.' })
    }

    const updated = await prisma.user.update({ where: { id: existing.id }, data: input })

    // A role change must not leave old sessions carrying the old permissions.
    if (input.role && input.role !== existing.role) {
      await revokeAllSessions(existing.id)
    }

    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Updated user', target: updated.email, category: 'User' })
    res.json({ user: publicUser(updated) })
  }),
)

/** Module 8 FE-3 — block or reinstate an account. */
usersRouter.post(
  '/:id/status',
  manage,
  route(async (req, res) => {
    const { status } = parse(
      z.object({ status: z.enum(['Active', 'Suspended', 'Invited']) }),
      req.body,
    )

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('User not found.')

    if (existing.id === req.user!.id) throw forbidden('You cannot change your own account status.')
    assertCanTargetRole(req.user!.role, existing.role as Role)
    if (status === 'Suspended' && existing.role === 'superadmin') {
      await assertNotLastSuperAdmin(existing.id)
    }

    const updated = await prisma.user.update({ where: { id: existing.id }, data: { status } })

    // Blocking ends every session immediately rather than at token expiry.
    if (status === 'Suspended') {
      const ended = await revokeAllSessions(existing.id)
      await notifyAdmins({
        tone: 'warning',
        title: 'Account blocked',
        detail: `${existing.email} was blocked by ${req.user!.name}. ${ended} session(s) ended.`,
        link: '/superadmin/users',
      })
    }

    await audit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      action: status === 'Suspended' ? 'Blocked account' : `Set account ${status.toLowerCase()}`,
      target: existing.email,
      category: 'User',
    })

    res.json({ user: publicUser(updated) })
  }),
)

/** Sends (or re-sends) the invitation / password-set link. */
usersRouter.post(
  '/:id/invite',
  manage,
  route(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('User not found.')
    if (existing.status === 'Suspended') throw forbidden('This account is blocked.')

    await sendInvitation(existing)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Sent invitation', target: existing.email, category: 'User' })
    res.json({ ok: true })
  }),
)

/** Signs a user out of every device. */
usersRouter.post(
  '/:id/revoke-sessions',
  manage,
  route(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('User not found.')
    assertCanTargetRole(req.user!.role, existing.role as Role)

    const ended = await revokeAllSessions(existing.id)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Ended all sessions', target: existing.email, category: 'Security' })
    res.json({ ended })
  }),
)

usersRouter.delete(
  '/:id',
  manage,
  route(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('User not found.')

    if (existing.id === req.user!.id) throw forbidden('You cannot delete your own account.')
    assertCanTargetRole(req.user!.role, existing.role as Role)
    if (existing.role === 'superadmin') await assertNotLastSuperAdmin(existing.id)

    await prisma.user.delete({ where: { id: existing.id } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Deleted user', target: existing.email, category: 'User' })
    res.json({ ok: true })
  }),
)

/* --------------------------------------------------------------- helpers */

/** Only a super admin may create or modify another super admin. */
function assertCanTargetRole(actorRole: Role, targetRole: Role): void {
  if (targetRole === 'superadmin' && actorRole !== 'superadmin') {
    throw forbidden('Only a super admin can manage super admin accounts.')
  }
}

async function assertNotLastSuperAdmin(excludingId: string): Promise<void> {
  const remaining = await prisma.user.count({
    where: { role: 'superadmin', status: 'Active', NOT: { id: excludingId } },
  })
  if (remaining === 0) {
    throw badRequest('This is the last active super admin. Promote another account first.')
  }
}

async function sendInvitation(user: { id: string; name: string; email: string }): Promise<void> {
  const raw = randomToken()
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  })

  await sendMessage({
    to: user.email,
    type: 'Password Reset',
    customerName: user.name,
    subject: 'Your SmartDine Optimizer account',
    body:
      `Hi ${user.name},\n\n` +
      `An account has been created for you on SmartDine Optimizer.\n` +
      `Use this code on the reset-password screen to choose your password. It expires in 7 days.\n\n${raw}\n`,
  })
}

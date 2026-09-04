import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { audit } from '../lib/audit.js'
import {
  checkPasswordStrength,
  hashPassword,
  hashToken,
  issueSession,
  randomToken,
  revokeAllSessions,
  revokeSession,
  verifyPassword,
} from '../lib/auth.js'
import { badRequest, forbidden, notFound, parse, route, unauthorized } from '../lib/http.js'
import { permissionsFor, roleLabels, type Role } from '../lib/permissions.js'
import { sendMessage } from '../lib/mailer.js'
import { getSystem } from '../lib/settings.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

const credentials = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

/** Module 8 FE-1 — sign in. */
authRouter.post(
  '/login',
  route(async (req, res) => {
    const { email, password } = parse(credentials, req.body)
    const system = await getSystem()

    const user = await prisma.user.findUnique({ where: { email } })

    // The same message for "no such user" and "wrong password", so the form
    // cannot be used to discover which addresses have accounts.
    const genericFailure = unauthorized('Email or password is incorrect.')

    if (!user) {
      await audit({ actorName: email, action: 'Failed sign-in attempt', target: email, category: 'Security', result: 'Failed' })
      throw genericFailure
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      await audit({ actorId: user.id, actorName: user.name, action: 'Failed sign-in attempt', target: email, category: 'Security', result: 'Failed' })
      throw genericFailure
    }

    if (user.status === 'Suspended') {
      await audit({ actorId: user.id, actorName: user.name, action: 'Blocked account sign-in attempt', target: email, category: 'Security', result: 'Failed' })
      throw forbidden('This account has been blocked. Contact an administrator.')
    }

    if (user.status === 'Invited') {
      throw forbidden('This invitation has not been accepted yet. Set a password using the reset link.')
    }

    // Module 8 FE-3 — the admin-only lockdown switch.
    if (system.adminOnlyLogin && user.role !== 'admin' && user.role !== 'superadmin') {
      await audit({ actorId: user.id, actorName: user.name, action: 'Sign-in blocked by admin-only mode', target: email, category: 'Security', result: 'Failed' })
      throw forbidden('Sign-in is restricted to administrators right now.')
    }

    const { token, expiresAt } = await issueSession(user, req)

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
    await audit({ actorId: user.id, actorName: user.name, action: 'Signed in', target: email, category: 'Security' })

    res.cookie('sd_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
    })

    res.json({ token, user: publicUser(user) })
  }),
)

authRouter.post(
  '/logout',
  requireAuth,
  route(async (req, res) => {
    await revokeSession(req.user!.tokenId)
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Signed out', target: req.user!.email, category: 'Security' })
    res.clearCookie('sd_token')
    res.json({ ok: true })
  }),
)

/** The client calls this on boot to restore a session. */
authRouter.get(
  '/me',
  requireAuth,
  route(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw unauthorized()
    res.json({ user: publicUser(user) })
  }),
)

/* ------------------------------------------------------- password recovery */

authRouter.post(
  '/forgot-password',
  route(async (req, res) => {
    const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email() }), req.body)
    const user = await prisma.user.findUnique({ where: { email } })

    // Always the same response — the form must not confirm whether an address
    // is registered.
    if (user && user.status !== 'Suspended') {
      const raw = randomToken()
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(raw),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      })

      await sendMessage({
        to: user.email,
        type: 'Password Reset',
        customerName: user.name,
        subject: 'Reset your SmartDine Optimizer password',
        body:
          `Hi ${user.name},\n\n` +
          `Use this code to reset your password. It expires in one hour.\n\n${raw}\n\n` +
          `If you did not request this, you can ignore this message.`,
      })

      await audit({ actorId: user.id, actorName: user.name, action: 'Requested password reset', target: email, category: 'Security' })
    }

    res.json({ ok: true, message: 'If that address has an account, a reset link is on its way.' })
  }),
)

authRouter.post(
  '/reset-password',
  route(async (req, res) => {
    const { token, password } = parse(
      z.object({ token: z.string().min(10), password: z.string().min(1) }),
      req.body,
    )

    const system = await getSystem()
    const weak = checkPasswordStrength(password, system)
    if (weak) throw badRequest(weak, { password: weak })

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw badRequest('That reset link is invalid or has expired.')
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash: await hashPassword(password),
          // Accepting an invitation by setting a password activates the account.
          status: record.user.status === 'Invited' ? 'Active' : record.user.status,
        },
      }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ])

    // A password change ends every existing session on that account.
    await revokeAllSessions(record.userId)
    await audit({ actorId: record.userId, actorName: record.user.name, action: 'Reset password', target: record.user.email, category: 'Security' })

    res.json({ ok: true })
  }),
)

authRouter.post(
  '/change-password',
  requireAuth,
  route(async (req, res) => {
    const { currentPassword, password } = parse(
      z.object({ currentPassword: z.string().min(1), password: z.string().min(1) }),
      req.body,
    )

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw unauthorized()

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw badRequest('Your current password is not correct.', {
        currentPassword: 'Your current password is not correct.',
      })
    }

    const system = await getSystem()
    const weak = checkPasswordStrength(password, system)
    if (weak) throw badRequest(weak, { password: weak })

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    })

    // Other devices are signed out; the one making the change stays in.
    const ended = await revokeAllSessions(user.id, req.user!.tokenId)
    await audit({ actorId: user.id, actorName: user.name, action: 'Changed password', target: user.email, category: 'Security' })

    res.json({ ok: true, otherSessionsEnded: ended })
  }),
)

/* -------------------------------------------------------------- sessions */

authRouter.get(
  '/sessions',
  requireAuth,
  route(async (req, res) => {
    const rows = await prisma.session.findMany({
      where: { userId: req.user!.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    })

    res.json({
      sessions: rows.map((s) => ({
        id: s.id,
        device: s.device,
        location: s.location,
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        current: s.tokenId === req.user!.tokenId,
      })),
    })
  }),
)

authRouter.delete(
  '/sessions/:id',
  requireAuth,
  route(async (req, res) => {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } })
    if (!session || session.userId !== req.user!.id) throw notFound('Session not found.')

    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
    await audit({ actorId: req.user!.id, actorName: req.user!.name, action: 'Ended a session', target: session.device, category: 'Security' })
    res.json({ ok: true })
  }),
)

export function publicUser(user: {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  lastActiveAt: Date | null
}) {
  const role = user.role as Role
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role,
    roleLabel: roleLabels[role],
    status: user.status,
    lastActiveAt: user.lastActiveAt,
    permissions: permissionsFor(role),
  }
}

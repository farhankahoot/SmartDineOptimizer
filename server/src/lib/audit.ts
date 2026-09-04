/**
 * Module 7 / Module 8 — every state-changing action is written to the audit
 * trail. Audit writes never fail a request: a lost log line is preferable to a
 * failed reservation.
 */
import { prisma } from '../db.js'

export type AuditCategory =
  | 'User'
  | 'Restaurant'
  | 'System'
  | 'Feature'
  | 'Content'
  | 'Security'
  | 'Reservation'
  | 'Table'
  | 'Slot'
  | 'Deal'
  | 'Staff'
  | 'Message'

export interface AuditInput {
  actorId?: string | null
  actorName?: string
  action: string
  target?: string
  category: AuditCategory
  result?: 'Success' | 'Failed'
}

export async function audit(entry: AuditInput): Promise<void> {
  try {
    await prisma.auditEntry.create({
      data: {
        actorId: entry.actorId ?? null,
        actorName: entry.actorName ?? 'System',
        action: entry.action,
        target: entry.target ?? '',
        category: entry.category,
        result: entry.result ?? 'Success',
      },
    })
  } catch (err) {
    console.error('[audit] could not write entry', err)
  }
}

/** Raises a control-centre notification. Same fire-and-forget contract. */
export async function notifyAdmins(entry: {
  tone: 'info' | 'warning' | 'danger' | 'success'
  title: string
  detail: string
  link?: string
}): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: { tone: entry.tone, title: entry.title, detail: entry.detail, link: entry.link ?? null },
    })
  } catch (err) {
    console.error('[notify] could not write notification', err)
  }
}

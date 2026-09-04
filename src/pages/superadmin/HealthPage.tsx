import { useState } from 'react'
import { AlertTriangle, Gauge, Info, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { type HealthState } from '@/data/platform'
import { useApi } from '@/lib/useApi'

interface HealthPayload {
  checks: {
    id: string
    name: string
    state: HealthState
    detail: string
    latencyMs?: number | null
  }[]
  uptimeSeconds: number
  startedAt: string
}

const stateTone: Record<HealthState, BadgeTone> = {
  Operational: 'confirmed',
  Degraded: 'pending',
  'Not configured': 'neutral',
  Down: 'cancelled',
}

const dotColor: Record<HealthState, string> = {
  Operational: 'bg-state-success',
  Degraded: 'bg-gold-400',
  'Not configured': 'bg-ink-faint',
  Down: 'bg-state-dangerSolid',
}

/**
 * Declared configuration status, not live probes. Nothing here is polled — the
 * page says so rather than implying real uptime data.
 */
export function HealthPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const [checking, setChecking] = useState(false)

  // Each component reports what the server can actually establish — a live
  // database round-trip, whether SMTP credentials exist — never a credential.
  const { data, refresh } = useApi<HealthPayload>('/platform/health')
  const healthChecks = data?.checks ?? []

  const operational = healthChecks.filter((h) => h.state === 'Operational').length
  const notConfigured = healthChecks.filter((h) => h.state === 'Not configured').length
  const degraded = healthChecks.filter((h) => h.state === 'Degraded').length

  const runChecks = async () => {
    setChecking(true)
    refresh()
    await new Promise((r) => setTimeout(r, 500))
    setChecking(false)
    push({
      tone: 'success',
      title: 'Health checks re-run',
      detail: `API up ${formatUptime(data?.uptimeSeconds ?? 0)}.`,
    })
  }

  return (
    <>
      <PageHeader
        title="System Health"
        underline
        onToggleNav={toggle}
        profileName="Super Admin"
        profileRole="Platform"
        action={
          <Button
            variant="outline"
            disabled={checking}
            leftIcon={<RefreshCw className={cn('size-[15px]', checking && 'animate-spin')} />}
            onClick={runChecks}
          >
            {checking ? 'Checking…' : 'Run checks'}
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {/* Honest framing, up front */}
        <div className="flex items-start gap-2.5 rounded-[10px] border border-gold-300 bg-[#FDF7E9] px-4 py-3">
          <Info className="mt-px size-[17px] shrink-0 text-gold-600" />
          <div>
            <p className="text-[12.5px] font-bold text-ink">
              Checked on request, not continuously monitored
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
              Each row is evaluated by the API when this page loads or you press Run checks — the
              database row is a real round-trip and reports its latency. Nothing polls in the
              background, and no external uptime history is kept, so this is a point-in-time
              snapshot rather than a status page.
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-[11.5px] text-ink-muted">Operational</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none text-state-success">
              {operational}
            </p>
            <p className="mt-1.5 text-[11px] text-ink-faint">
              of {healthChecks.length} components
            </p>
            {data && (
              <p className="mt-1 text-[10.5px] text-ink-faint">
                API up {formatUptime(data.uptimeSeconds)}
              </p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-[11.5px] text-ink-muted">Degraded</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none text-gold-600">{degraded}</p>
            <p className="mt-1.5 text-[11px] text-ink-faint">Working, but needs attention</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11.5px] text-ink-muted">Not configured</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none text-ink">{notConfigured}</p>
            <p className="mt-1.5 text-[11px] text-ink-faint">Backend work outstanding</p>
          </Card>
        </section>

        <Card className="p-4">
          <SectionTitle icon={<Gauge className="size-[16px]" strokeWidth={2.3} />}>
            Components
          </SectionTitle>

          <ul className="mt-3.5 divide-y divide-line-soft">
            {healthChecks.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <span className={cn('size-[10px] shrink-0 rounded-full', dotColor[h.state])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink">{h.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">{h.detail}</p>
                </div>
                {typeof h.latencyMs === 'number' && (
                  <code className="shrink-0 rounded bg-line-soft px-1.5 py-0.5 text-[10px] text-ink-muted">
                    {h.latencyMs}ms
                  </code>
                )}
                <Badge tone={stateTone[h.state]}>{h.state}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={<AlertTriangle className="size-[16px]" strokeWidth={2.3} />}>
            Before Launch
          </SectionTitle>
          <ol className="mt-3 grid gap-2">
            {[
              'Move the database from SQLite to MySQL 8 — set the Prisma provider and DATABASE_URL.',
              'Set a strong JWT_SECRET and serve the API over HTTPS.',
              'Configure object storage so uploaded restaurant covers are not held inline in the database.',
              'Train and deploy the prediction service, then have it POST to /api/predictions/ingest.',
              'Add SMTP credentials, then SMS and WhatsApp API keys for notifications.',
              'Schedule database backups and verify a restore.',
            ].map((step, i) => (
              <li
                key={step}
                className="flex gap-2.5 rounded-[9px] border border-line bg-[#FBF9F7] px-3.5 py-2.5"
              >
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-[12px] leading-snug text-ink-soft">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}

/** Renders a second count as a short human duration. */
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

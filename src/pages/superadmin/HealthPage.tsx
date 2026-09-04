import { useState } from 'react'
import { AlertTriangle, Gauge, Info, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { healthChecks, type HealthState } from '@/data/platform'

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

  const operational = healthChecks.filter((h) => h.state === 'Operational').length
  const notConfigured = healthChecks.filter((h) => h.state === 'Not configured').length
  const degraded = healthChecks.filter((h) => h.state === 'Degraded').length

  const runChecks = async () => {
    setChecking(true)
    await new Promise((r) => setTimeout(r, 900))
    setChecking(false)
    push({
      tone: 'info',
      title: 'Health checks need a backend',
      detail: 'Wire GET /health/* to replace these declared states with live probes.',
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
              These are declared states, not live health probes
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
              Nothing on this page polls a server. Each row shows how the component is configured in
              this build and the endpoint a real deployment would poll. Treat it as a launch
              checklist rather than a status page.
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-[11.5px] text-ink-muted">Operational</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none text-state-success">
              {operational}
            </p>
            <p className="mt-1.5 text-[11px] text-ink-faint">of {healthChecks.length} components</p>
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
                <code className="shrink-0 rounded bg-line-soft px-1.5 py-0.5 text-[10px] text-ink-muted">
                  {h.endpoint}
                </code>
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
              'Move authentication to a server session — passwords are compared client-side today.',
              'Connect the MySQL database and replace the mock data layer in src/data.',
              'Expose the REST API the console reads and writes through.',
              'Configure media storage so uploaded restaurant covers persist.',
              'Deploy the Python prediction service and point the dashboard at it.',
              'Add SMTP credentials, then SMS and WhatsApp API keys for notifications.',
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

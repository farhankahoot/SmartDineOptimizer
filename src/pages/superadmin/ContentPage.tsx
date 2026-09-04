import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Loader2, Megaphone, RotateCcw, Save, Type } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Textarea, Toggle } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { usePlatform } from '@/store/PlatformContext'
import type { LandingContent } from '@/data/platform'

interface FieldSpec {
  key: keyof LandingContent
  label: string
  hint?: string
  multiline?: boolean
  max?: number
}

const sections: { title: string; description: string; fields: FieldSpec[] }[] = [
  {
    title: 'Hero',
    description: 'The first thing a visitor reads at the top of the landing page.',
    fields: [
      { key: 'heroBadge', label: 'Badge text', max: 60 },
      { key: 'heroTitleTop', label: 'Headline — first line', max: 40 },
      { key: 'heroTitleAccent', label: 'Headline — accent line', hint: '(shown in gold)', max: 40 },
      { key: 'heroSubtitle', label: 'Supporting paragraph', multiline: true, max: 300 },
    ],
  },
  {
    title: 'Calls to action',
    description: 'Button labels. Destinations stay fixed so links can never break.',
    fields: [
      { key: 'primaryCtaLabel', label: 'Primary button', hint: '→ /reserve', max: 28 },
      { key: 'secondaryCtaLabel', label: 'Secondary button', hint: '→ product section', max: 28 },
    ],
  },
  {
    title: 'Restaurant showcase',
    description: 'Heading above the Pakistan restaurant carousel.',
    fields: [
      { key: 'showcaseEyebrow', label: 'Eyebrow', max: 40 },
      { key: 'showcaseTitle', label: 'Section title', max: 70 },
      { key: 'showcaseLead', label: 'Lead paragraph', multiline: true, max: 240 },
    ],
  },
  {
    title: 'Closing call to action',
    description: 'The dark panel at the bottom of the page.',
    fields: [
      { key: 'finalCtaTitle', label: 'Title', max: 60 },
      { key: 'finalCtaBody', label: 'Body', multiline: true, max: 240 },
    ],
  },
]

/** Landing-page CMS — edits the copy the public site actually renders. */
export function ContentPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { landing, setLanding, resetLanding, log } = usePlatform()

  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const save = async (label: string) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    log({ action: `Updated landing ${label.toLowerCase()}`, target: 'Landing page', category: 'Content' })
    push({ tone: 'success', title: `${label} saved`, detail: 'Live on the landing page.' })
  }

  return (
    <>
      <PageHeader
        title="Landing Page"
        underline
        onToggleNav={toggle}
        profileName="Super Admin"
        profileRole="Platform"
        action={
          <Link to="/" target="_blank" rel="noreferrer">
            <Button variant="outline" leftIcon={<ExternalLink className="size-[15px]" />}>
              View live page
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-white px-4 py-3">
          <Type className="size-[17px] shrink-0 text-brand-700" />
          <p className="text-[12.5px] text-ink-soft">
            Copy edits apply immediately. Structural sections — features, workflow, FAQ, comparison
            — stay in code so the page cannot be broken from here.
          </p>
          <Button
            size="sm"
            variant="outlineNeutral"
            className="ml-auto"
            leftIcon={<RotateCcw className="size-[13px]" />}
            onClick={() => setResetOpen(true)}
          >
            Reset to defaults
          </Button>
        </div>

        {/* Announcement bar */}
        <Card className="p-5">
          <SectionTitle icon={<Megaphone className="size-[16px]" strokeWidth={2.3} />}>
            Announcement Bar
          </SectionTitle>
          <p className="mt-1 text-[11.5px] text-ink-muted">
            Optional strip shown above the landing hero.
          </p>

          <div className="mt-3.5 flex items-start gap-3 rounded-[10px] border border-line px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-ink">Show the announcement</p>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                {landing.announcementEnabled ? 'Currently visible to visitors.' : 'Currently hidden.'}
              </p>
            </div>
            <Toggle
              label="Show announcement"
              checked={landing.announcementEnabled}
              onChange={(v) => {
                setLanding({ announcementEnabled: v })
                push({ tone: v ? 'success' : 'info', title: `Announcement ${v ? 'shown' : 'hidden'}` })
              }}
            />
          </div>

          <div className="mt-3.5">
            <Label htmlFor="ann-text" hint={`${landing.announcementText.length}/120`}>
              Announcement text
            </Label>
            <Input
              id="ann-text"
              maxLength={120}
              value={landing.announcementText}
              onChange={(e) => setLanding({ announcementText: e.target.value })}
            />
          </div>

          <div className="mt-3.5 flex justify-end">
            <Button
              size="sm"
              disabled={saving}
              leftIcon={saving ? <Loader2 className="size-[13px] animate-spin" /> : <Save className="size-[13px]" />}
              onClick={() => save('Announcement')}
            >
              Save announcement
            </Button>
          </div>
        </Card>

        {/* Copy sections */}
        {sections.map((section) => (
          <Card key={section.title} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <h2 className="text-[15px] font-bold text-ink">{section.title}</h2>
                <p className="mt-1 max-w-[560px] text-[12px] text-ink-muted">{section.description}</p>
              </div>
              <Button
                size="sm"
                disabled={saving}
                leftIcon={saving ? <Loader2 className="size-[13px] animate-spin" /> : <Save className="size-[13px]" />}
                onClick={() => save(section.title)}
              >
                Save
              </Button>
            </div>

            <div className="grid gap-3.5 pt-4 sm:grid-cols-2">
              {section.fields.map((f) => {
                const value = String(landing[f.key] ?? '')
                return (
                  <div key={String(f.key)} className={f.multiline ? 'sm:col-span-2' : undefined}>
                    <Label htmlFor={String(f.key)} hint={f.max ? `${value.length}/${f.max}` : f.hint}>
                      {f.label}
                    </Label>
                    {f.multiline ? (
                      <Textarea
                        id={String(f.key)}
                        rows={3}
                        maxLength={f.max}
                        value={value}
                        onChange={(e) => setLanding({ [f.key]: e.target.value } as Partial<LandingContent>)}
                      />
                    ) : (
                      <Input
                        id={String(f.key)}
                        maxLength={f.max}
                        value={value}
                        onChange={(e) => setLanding({ [f.key]: e.target.value } as Partial<LandingContent>)}
                      />
                    )}
                    {f.hint && f.max && (
                      <p className="mt-1 text-[10.5px] text-ink-faint">{f.hint}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}

        {/* Hero preview */}
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-[#F4F2EF] px-4 py-2.5">
            <p className="text-[11.5px] font-semibold text-ink-soft">Hero preview</p>
          </div>
          <div className="bg-[#0C0C0E] px-6 py-10 text-center">
            <span className="inline-flex items-center rounded-full border border-gold-600/40 bg-white/[0.04] px-3.5 py-1.5 text-[11.5px] font-semibold text-gold-300">
              {landing.heroBadge}
            </span>
            <h3 className="mt-4 text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {landing.heroTitleTop}
              <br />
              <span className="text-gold-300">{landing.heroTitleAccent}</span>
            </h3>
            <p className="mx-auto mt-3.5 max-w-[520px] text-[13px] leading-relaxed text-white/75">
              {landing.heroSubtitle}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <span className="brand-fill rounded-[9px] px-4 py-2 text-[13px] font-semibold text-white">
                {landing.primaryCtaLabel}
              </span>
              <span className="rounded-[9px] border border-white/25 px-4 py-2 text-[13px] font-semibold text-white">
                {landing.secondaryCtaLabel}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset landing page content?"
        message="Every heading, paragraph and button label returns to the shipped defaults. Restaurant showcase entries are not affected."
        confirmLabel="Reset content"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetLanding()
          push({ tone: 'success', title: 'Landing content reset' })
          setResetOpen(false)
        }}
      />
    </>
  )
}

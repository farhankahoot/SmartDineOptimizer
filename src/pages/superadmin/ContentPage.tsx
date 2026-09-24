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
import { useApi } from '@/lib/useApi'
import type { LandingContent } from '@/data/platform'

interface FieldSpec {
  key: keyof LandingContent
  label: string
  hint?: string
  multiline?: boolean
  max?: number
}

/**
 * Only the copy the public page genuinely renders.
 *
 * The badge, the first headline line and the button labels used to be editable
 * here and are not any more: the page derives the badge and headline from the
 * restaurant profile, and the buttons change their own label with live
 * availability ("Choose your table" / "See other times"). A field that saves
 * successfully and then changes nothing on the page is worse than no field —
 * there is no way for an administrator to tell it did nothing.
 */
const sections: { title: string; description: string; fields: FieldSpec[] }[] = [
  {
    title: 'Hero',
    description:
      'The headline and paragraph at the top of the page. The badge above them reads the cuisine and city from Settings › Profile.',
    fields: [
      {
        key: 'heroTitleAccent',
        label: 'Headline — second line',
        hint: 'Shown in gold, under "A table at <restaurant>,"',
        max: 40,
      },
      { key: 'heroSubtitle', label: 'Supporting paragraph', multiline: true, max: 300 },
    ],
  },
  {
    title: 'Closing panel',
    description: 'The dark card beside the questions section, near the foot of the page.',
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
  // The preview shows the headline's derived first line, so it needs the name.
  const { data: config } = useApi<{ profile: { name: string } }>('/public/config')
  const profileName = config?.profile.name ?? 'Asian Wok'

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
            Copy edits apply immediately. Section headings, the FAQ and anything read from live
            data stay in code so the page cannot be broken from here.
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
          <div className="bg-[#0C0C0E] px-6 py-10">
            {/*
              The parts in grey are not editable here — the headline's first
              line comes from the restaurant name in Settings › Profile. Showing
              them greyed keeps the preview honest about what this page controls.
            */}
            <h3 className="max-w-[520px] text-[26px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white/35">
              A table at {profileName},
              <br />
              <span className="text-gold-300">{landing.heroTitleAccent}</span>
            </h3>
            <p className="mt-3.5 max-w-[480px] text-[13px] leading-relaxed text-white/70">
              {landing.heroSubtitle}
            </p>

            <div className="mt-7 max-w-[300px] rounded-[12px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[14px] font-extrabold text-white">{landing.finalCtaTitle}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">
                {landing.finalCtaBody}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset landing page content?"
        message="The hero headline, supporting paragraph, closing panel and announcement bar all return to the shipped defaults."
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

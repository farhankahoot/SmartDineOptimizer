import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, MessageSquare, Star } from 'lucide-react'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { api, fieldErrorsOf, messageOf } from '@/lib/api'
import { cn } from '@/lib/cn'

const topics = ['Food', 'Service', 'Booking', 'Ambience', 'Other'] as const

/**
 * Guest feedback.
 *
 * The header carried a Feedback link that pointed back at the home page, so it
 * appeared to do nothing. This is the page it was promising: a short form that
 * stores the comment and raises it to the restaurant, with a low rating
 * flagged as something to look at today.
 */
export function FeedbackPage() {
  const { push } = useToast()

  const [form, setForm] = useState({
    name: '',
    email: '',
    reference: '',
    rating: 0,
    topic: 'Food' as (typeof topics)[number],
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    const next: Record<string, string> = {}
    if (form.name.trim().length < 2) next.name = 'Please tell us your name.'
    if (form.rating === 0) next.rating = 'Choose a rating.'
    if (form.message.trim().length < 10) next.message = 'Tell us a little more.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await api.post('/public/feedback', {
        name: form.name.trim(),
        email: form.email.trim(),
        reference: form.reference.trim(),
        rating: form.rating,
        topic: form.topic,
        message: form.message.trim(),
      })
      setSent(true)
    } catch (err) {
      const details = fieldErrorsOf(err)
      setErrors(details)
      push({ tone: 'error', title: 'Not sent', detail: messageOf(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-page">
      <div className="relative overflow-hidden bg-[#150E09]">
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(120% 90% at 20% 0%, #3A2A1C 0%, #241811 45%, #150E09 100%)',
          }}
        />
        <PublicHeader activeLabel="Feedback" />

        <div className="relative mx-auto max-w-[820px] px-5 pb-12 pt-10 text-center">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.025em] text-white sm:text-[38px]">
            How was your visit?
          </h1>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-relaxed text-white/65">
            Good or bad, we would rather hear it. Every comment reaches the restaurant directly.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[680px] px-5 py-10">
        {sent ? (
          <div className="rounded-[14px] border border-line bg-white p-8 text-center shadow-panel">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EAF6EC]">
              <CheckCircle2 className="size-8 text-state-success" strokeWidth={2} />
            </span>
            <h2 className="mt-4 text-[21px] font-extrabold text-ink">Thank you</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-ink-muted">
              Your comment has gone straight to the restaurant. If you left an email and it needs a
              reply, someone will be in touch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link to="/">
                <Button variant="outline">Back to home</Button>
              </Link>
              <Link to="/reserve">
                <Button>Book another table</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="grid gap-4 rounded-[14px] border border-line bg-white p-6 shadow-panel sm:p-7"
          >
            <div>
              <Label required>How would you rate it?</Label>
              <div className="mt-1.5 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} out of 5`}
                    aria-pressed={form.rating === n}
                    onClick={() => set('rating', n)}
                    className="focus-ring rounded-lg p-1 transition hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'size-8 transition-colors',
                        n <= form.rating
                          ? 'fill-gold-400 text-gold-400'
                          : 'fill-transparent text-line',
                      )}
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
                {form.rating > 0 && (
                  <span className="ml-2 text-[12.5px] font-semibold text-ink-muted">
                    {['Poor', 'Not great', 'Fine', 'Good', 'Excellent'][form.rating - 1]}
                  </span>
                )}
              </div>
              <FieldError>{errors.rating}</FieldError>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fb-name" required>
                  Your name
                </Label>
                <Input
                  id="fb-name"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Enter your name"
                />
                <FieldError>{errors.name}</FieldError>
              </div>
              <div>
                <Label htmlFor="fb-email">Email (optional)</Label>
                <Input
                  id="fb-email"
                  type="email"
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="Only if you would like a reply"
                />
                <FieldError>{errors.email}</FieldError>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fb-topic">What is it about?</Label>
                <Select
                  id="fb-topic"
                  value={form.topic}
                  onChange={(e) => set('topic', e.target.value as (typeof topics)[number])}
                  options={topics.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div>
                <Label htmlFor="fb-ref">Booking reference (optional)</Label>
                <Input
                  id="fb-ref"
                  value={form.reference}
                  onChange={(e) => set('reference', e.target.value)}
                  placeholder="RES-2026-1001"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fb-message" required>
                Your feedback
              </Label>
              <Textarea
                id="fb-message"
                rows={5}
                maxLength={1000}
                value={form.message}
                error={errors.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Tell us what went well, or what we should fix."
                counter={`${form.message.length}/1000`}
              />
              <FieldError>{errors.message}</FieldError>
            </div>

            <Button
              type="submit"
              size="lg"
              block
              disabled={submitting}
              leftIcon={
                submitting ? (
                  <Loader2 className="size-[16px] animate-spin" />
                ) : (
                  <MessageSquare className="size-[16px]" />
                )
              }
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </Button>

            <p className="text-center text-[11.5px] text-ink-muted">
              We only use your details to follow up on this comment.
            </p>
          </form>
        )}
      </main>
    </div>
  )
}

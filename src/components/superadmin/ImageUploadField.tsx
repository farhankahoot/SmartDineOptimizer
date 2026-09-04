import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Field'
import { IMAGE_GUIDANCE } from '@/data/restaurants'

interface Analysis {
  width: number
  height: number
  bytes: number
  ratio: number
}

/**
 * Cover-image picker for the showcase carousel. The card renders its image in an
 * `aspect-[16/10]` box with `object-fit: cover`, so the guidance below is derived
 * from that container rather than picked arbitrarily.
 */
export function ImageUploadField({
  value,
  onChange,
  fallback,
}: {
  value?: string
  onChange: (dataUrl?: string) => void
  /** Gradient shown when no image is set, matching the public card. */
  fallback: [string, string]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [dragging, setDragging] = useState(false)

  const accept = IMAGE_GUIDANCE.formats.join(',')

  const handleFile = async (file: File) => {
    setError('')
    setAnalysis(null)

    if (!IMAGE_GUIDANCE.formats.includes(file.type as never)) {
      setError(`Unsupported format. Use ${IMAGE_GUIDANCE.formatLabel}.`)
      return
    }
    if (file.size > IMAGE_GUIDANCE.maxBytes) {
      setError(
        `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${IMAGE_GUIDANCE.maxLabel}.`,
      )
      return
    }

    setBusy(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read that file.'))
        reader.readAsDataURL(file)
      })

      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('That file is not a readable image.'))
        img.src = dataUrl
      })

      setAnalysis({ ...dims, bytes: file.size, ratio: dims.width / dims.height })
      onChange(dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const ratioOff = analysis ? Math.abs(analysis.ratio - IMAGE_GUIDANCE.ratioValue) > 0.12 : false
  const tooSmall = analysis ? analysis.width < 800 : false

  return (
    <div>
      <Label>Cover image</Label>

      {/* Guidance — derived from the carousel's own container */}
      <div className="mb-2.5 rounded-[9px] border border-gold-300 bg-[#FDF7E9] px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
          <ImagePlus className="size-[13px] text-gold-600" />
          Recommended: {IMAGE_GUIDANCE.width} × {IMAGE_GUIDANCE.height} px ({IMAGE_GUIDANCE.ratio})
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          Max {IMAGE_GUIDANCE.maxLabel} · {IMAGE_GUIDANCE.formatLabel}. The carousel crops with{' '}
          <code className="rounded bg-white px-1 text-[10px]">object-fit: cover</code>, so keep the
          subject centred — edges may be trimmed on narrow screens.
        </p>
      </div>

      {/* Drop zone / preview at the real card ratio */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
        className={cn(
          'relative overflow-hidden rounded-[10px] border-2 border-dashed transition',
          dragging ? 'border-brand-400 bg-brand-50' : 'border-line bg-[#FBF9F7]',
          error && 'border-state-danger/50',
        )}
      >
        <div className="aspect-[16/10] w-full">
          {value ? (
            <img
              src={value}
              alt="Selected restaurant cover preview"
              className="size-full object-cover"
            />
          ) : (
            <div
              className="flex size-full flex-col items-center justify-center gap-2 text-center"
              style={{ backgroundImage: `linear-gradient(135deg, ${fallback[0]}, ${fallback[1]})` }}
            >
              <Upload className="size-6 text-white/70" strokeWidth={1.8} />
              <p className="px-4 text-[12px] font-semibold text-white/85">
                Drag an image here, or choose a file
              </p>
              <p className="text-[10.5px] text-white/60">
                No image uploaded — this gradient is used on the public card
              </p>
            </div>
          )}
        </div>

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-brand-700" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Upload className="size-[13px]" />}
          onClick={() => inputRef.current?.click()}
        >
          {value ? 'Replace image' : 'Choose image'}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outlineDanger"
            leftIcon={<Trash2 className="size-[13px]" />}
            onClick={() => {
              onChange(undefined)
              setAnalysis(null)
              setError('')
            }}
          >
            Remove
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] font-medium text-state-danger" role="alert">
          <AlertTriangle className="mt-px size-[13px] shrink-0" />
          {error}
        </p>
      )}

      {analysis && !error && (
        <ul className="mt-2.5 grid gap-1">
          <Check
            ok={!tooSmall}
            okText={`Resolution ${analysis.width} × ${analysis.height} px is sharp enough`}
            badText={`Only ${analysis.width} × ${analysis.height} px — may look soft. Aim for ${IMAGE_GUIDANCE.width} px wide.`}
          />
          <Check
            ok={!ratioOff}
            okText={`Aspect ratio ${analysis.ratio.toFixed(2)}:1 matches the ${IMAGE_GUIDANCE.ratio} card`}
            badText={`Aspect ratio is ${analysis.ratio.toFixed(2)}:1 — the card is ${IMAGE_GUIDANCE.ratio}, so edges will be cropped.`}
          />
          <Check
            ok
            okText={`File size ${(analysis.bytes / 1024).toFixed(0)} KB (limit ${IMAGE_GUIDANCE.maxLabel})`}
            badText=""
          />
        </ul>
      )}
    </div>
  )
}

function Check({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <li
      className={cn(
        'flex items-start gap-1.5 text-[11px]',
        ok ? 'text-state-success' : 'text-gold-600',
      )}
    >
      {ok ? (
        <CheckCircle2 className="mt-px size-[12px] shrink-0" />
      ) : (
        <AlertTriangle className="mt-px size-[12px] shrink-0" />
      )}
      {ok ? okText : badText}
    </li>
  )
}

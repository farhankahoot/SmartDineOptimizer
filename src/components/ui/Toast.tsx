import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  tone: Tone
  title: string
  detail?: string
}

const ToastContext = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => {} })

const tones: Record<Tone, { icon: typeof CheckCircle2; ring: string; fg: string }> = {
  success: { icon: CheckCircle2, ring: 'border-state-success/30 bg-[#F1F9F3]', fg: 'text-state-success' },
  error: { icon: XCircle, ring: 'border-state-danger/30 bg-[#FDF1F0]', fg: 'text-state-danger' },
  warning: { icon: AlertTriangle, ring: 'border-gold-300 bg-[#FDF7E9]', fg: 'text-gold-600' },
  info: { icon: Info, ring: 'border-line bg-white', fg: 'text-brand-700' },
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId++
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[320px] flex-col gap-2"
          role="status"
          aria-live="polite"
        >
          {toasts.map((t) => {
            const { icon: Icon, ring, fg } = tones[t.tone]
            return (
              <div
                key={t.id}
                className={cn(
                  'pointer-events-auto flex animate-scale-in items-start gap-2.5 rounded-[10px] border px-3.5 py-3 shadow-pop',
                  ring,
                )}
              >
                <Icon className={cn('mt-px size-[17px] shrink-0', fg)} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold text-ink">{t.title}</p>
                  {t.detail && <p className="mt-0.5 text-[11.5px] text-ink-muted">{t.detail}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="focus-ring -mr-1 rounded p-0.5 text-ink-faint transition hover:text-ink"
                >
                  <X className="size-[14px]" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

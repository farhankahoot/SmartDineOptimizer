import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

/** Confirmation gate for destructive actions (delete table, remove deal, …). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  tone = 'danger',
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'primary'
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width="max-w-[420px]"
      footer={
        <>
          <Button variant="outlineNeutral" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-state-dangerBg text-state-danger">
          <AlertTriangle className="size-[18px]" strokeWidth={2} />
        </span>
        <p className="text-[13px] leading-relaxed text-ink-soft">{message}</p>
      </div>
    </Modal>
  )
}

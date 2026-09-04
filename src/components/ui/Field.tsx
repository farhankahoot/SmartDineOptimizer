import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Label({
  children,
  required,
  hint,
  className,
  htmlFor,
}: {
  children: ReactNode
  required?: boolean
  hint?: string
  className?: string
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-[12.5px] font-semibold text-ink', className)}
    >
      {children}
      {required && <span className="ml-0.5 text-brand-600">*</span>}
      {hint && <span className="ml-1 font-normal text-ink-faint">{hint}</span>}
    </label>
  )
}

const control =
  'w-full rounded-[8px] border border-line bg-white text-[13px] text-ink placeholder:text-ink-faint ' +
  'transition focus:border-brand-300 focus-ring disabled:bg-line-soft disabled:text-ink-muted'

const invalidControl = 'border-state-danger/60 focus:border-state-danger'

/** Inline validation message rendered beneath a control. */
export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-state-danger" role="alert">
      <AlertCircle className="size-[12px] shrink-0" />
      {children}
    </p>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  trailing?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, trailing, error, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint [&>svg]:size-[15px]">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          control,
          'h-[42px]',
          icon ? 'pl-9' : 'pl-3.5',
          trailing ? 'pr-9' : 'pr-3.5',
          error && invalidControl,
          className,
        )}
        {...rest}
      />
      {trailing && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint [&>svg]:size-[15px]">
          {trailing}
        </span>
      )}
    </div>
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: ReactNode
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { icon, options, placeholder, error, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint [&>svg]:size-[15px]">
          {icon}
        </span>
      )}
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          control,
          'h-[42px] cursor-pointer pr-9',
          icon ? 'pl-9' : 'pl-3.5',
          error && invalidControl,
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
    </div>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: ReactNode
  counter?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { icon, counter, error, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-[13px] text-ink-faint [&>svg]:size-[15px]">
          {icon}
        </span>
      )}
      <textarea
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          control,
          'block resize-none py-3 pr-3.5',
          icon ? 'pl-9' : 'pl-3.5',
          counter && 'pb-7',
          error && invalidControl,
          className,
        )}
        {...rest}
      />
      {counter && (
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-ink-faint">
          {counter}
        </span>
      )}
    </div>
  )
})

/** Red pill toggle from the Notification Settings panel. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand-800' : 'bg-[#D4D4DA]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-[21px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

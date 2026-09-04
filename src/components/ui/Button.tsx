import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant =
  | 'primary' // deep maroon gradient — Add Reservation, Confirm, Update, Send Message
  | 'primaryBright' // brighter red — Resend / Send Reminder
  | 'success' // forest green solid — Confirm, Mark Completed
  | 'danger' // bright red solid — Reject (Food Deals)
  | 'outline' // white + maroon border, maroon label — Cancel, Edit, View All
  | 'outlineNeutral' // white + grey border, grey label — View, Send Reminder
  | 'outlineSuccess' // white + green border, green label — Open Slot, Activate
  | 'outlineDanger' // white + red border, red label — Delete, Close Slot
  | 'ghost'

type Size = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'brand-fill text-white shadow-[0_1px_2px_rgba(94,10,12,.35)] hover:brightness-110',
  primaryBright: 'brand-fill-bright text-white hover:brightness-110',
  success: 'bg-[#125E2E] text-white hover:bg-[#0E4E26]',
  danger: 'bg-state-dangerSolid text-white hover:brightness-105',
  outline:
    'bg-white text-brand-700 border border-brand-300/70 hover:bg-brand-50 hover:border-brand-400',
  outlineNeutral: 'bg-white text-ink-soft border border-line hover:bg-line-soft',
  outlineSuccess:
    'bg-white text-state-success border border-state-success/40 hover:bg-state-successBg',
  outlineDanger: 'bg-white text-state-danger border border-state-danger/35 hover:bg-state-dangerBg',
  ghost: 'bg-transparent text-ink-soft hover:bg-line-soft',
}

const sizes: Record<Size, string> = {
  xs: 'h-[26px] px-2 text-[10.5px] gap-1 rounded-[6px]',
  sm: 'h-[30px] px-2.5 text-xs gap-1.5 rounded-[7px]',
  md: 'h-[38px] px-4 text-[13px] gap-2 rounded-[8px]',
  lg: 'h-[46px] px-5 text-[15px] gap-2.5 rounded-[9px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition',
        'focus-ring disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
})

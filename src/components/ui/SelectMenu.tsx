import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

/**
 * The change handler keeps the shape a native `<select>` produces, so the
 * seventy-odd existing call sites reading `e.target.value` continue to work
 * unchanged.
 */
export interface SelectChangeEvent {
  target: { value: string; name?: string }
}

export interface SelectMenuProps {
  options: SelectOption[]
  value?: string
  onChange?: (event: SelectChangeEvent) => void
  placeholder?: string
  icon?: ReactNode
  error?: string
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  'aria-label'?: string
}

/**
 * A custom listbox.
 *
 * A native `<select>` renders its popup through the operating system, so the
 * list cannot be styled at all — it is the one part of a form that ignores the
 * design system entirely. This replaces it with a real listbox: the same
 * rounded surfaces, brand colours and motion as the rest of the console.
 *
 * Replacing a native control means re-implementing what it gave for free, so
 * this supports full keyboard control (arrows, Home/End, Enter, Escape,
 * type-ahead), announces itself correctly to screen readers, closes on outside
 * click, and flips above the trigger when there is no room below.
 */
export function SelectMenu({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  icon,
  error,
  disabled,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dropUp, setDropUp] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  /** Buffer for type-ahead, cleared after a pause in typing. */
  const typeAhead = useRef({ term: '', at: 0 })

  const listId = useId()
  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const commit = useCallback(
    (index: number) => {
      const option = options[index]
      if (!option) return
      onChange?.({ target: { value: option.value, name } })
      setOpen(false)
      triggerRef.current?.focus()
    },
    [options, onChange, name],
  )

  /* ------------------------------------------------------ open / close */

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // A scrolling page would leave the panel detached from its trigger.
    const onScroll = () => setOpen(false)

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  // Decide direction before paint, so the panel never visibly jumps.
  useLayoutEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    setDropUp(spaceBelow < 260 && rect.top > spaceBelow)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex])

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  /* --------------------------------------------------------- keyboard */

  const move = (delta: number) => {
    setActiveIndex((current) => {
      const next = current + delta
      if (next < 0) return options.length - 1
      if (next >= options.length) return 0
      return next
    })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
      case 'Tab':
        setOpen(false)
        break
      default: {
        // Type-ahead: letters typed in quick succession jump to a match.
        if (e.key.length !== 1) return
        const now = Date.now()
        const term = (now - typeAhead.current.at < 600 ? typeAhead.current.term : '') + e.key
        typeAhead.current = { term, at: now }

        const match = options.findIndex((o) => o.label.toLowerCase().startsWith(term.toLowerCase()))
        if (match >= 0) setActiveIndex(match)
      }
    }
  }

  /* ------------------------------------------------------------ render */

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={error ? true : undefined}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-[42px] w-full items-center gap-2 rounded-[10px] border bg-white pr-3 text-left text-[13px] transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/25',
          icon ? 'pl-9' : 'pl-3.5',
          disabled && 'cursor-not-allowed bg-line-soft/40 text-ink-faint',
          error
            ? 'border-state-danger'
            : open
              ? 'border-brand-700 ring-2 ring-brand-700/15'
              : 'border-line hover:border-brand-200',
        )}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint [&>svg]:size-[15px]">
            {icon}
          </span>
        )}
        <span className={cn('flex-1 truncate', selected ? 'text-ink' : 'text-ink-faint')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-ink-muted transition-transform duration-200',
            open && 'rotate-180 text-brand-700',
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onKeyDown={onKeyDown}
          className={cn(
            'absolute z-50 max-h-[264px] w-full overflow-y-auto rounded-[12px] border border-line bg-white p-1.5 shadow-pop',
            'motion-safe:animate-scale-in',
            dropUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top',
          )}
        >
          {options.length === 0 && (
            <li className="px-3 py-2.5 text-[12.5px] text-ink-faint">No options</li>
          )}

          {options.map((o, i) => {
            const isSelected = o.value === value
            const isActive = i === activeIndex
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(i)}
                onPointerMove={() => setActiveIndex(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-[13px] transition-colors',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft',
                  isSelected && 'font-semibold text-brand-700',
                )}
              >
                <span className="flex-1 truncate">{o.label}</span>
                {isSelected && <Check className="size-[14px] shrink-0 text-brand-700" strokeWidth={3} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

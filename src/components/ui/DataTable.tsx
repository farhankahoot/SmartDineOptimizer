import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: ReactNode
  /** Tailwind width/alignment classes applied to both header cell and body cells. */
  className?: string
  align?: 'left' | 'center' | 'right'
  /** Long prose columns ("Included Items", "Special Request") wrap to 2 lines. */
  wrap?: boolean
  render: (row: T, index: number) => ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  /** `grid` draws vertical cell borders + a tinted header (Food Deals module). */
  variant = 'plain',
  emptyMessage = 'No records found.',
  minWidth = 900,
  rowNumbers = true,
  startIndex = 0,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string
  variant?: 'plain' | 'grid'
  emptyMessage?: string
  minWidth?: number
  /** Set false for tables where a position number would be meaningless. */
  rowNumbers?: boolean
  /**
   * Where this page starts in the whole set, so a paginated table numbers its
   * second page 11, 12, 13 … rather than restarting at 1.
   */
  startIndex?: number
}) {
  const grid = variant === 'grid'

  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-left', grid && 'border border-line')}
        style={{ minWidth }}
      >
        <thead>
          <tr className={grid ? 'bg-[#FAF6F0]' : 'bg-white'}>
            {rowNumbers && (
              <th
                scope="col"
                className={cn(
                  'w-[46px] whitespace-nowrap px-1.5 py-3 text-center text-[11.5px] font-bold text-ink-faint',
                  grid ? 'border border-line' : 'border-b border-line',
                )}
              >
                #
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-1.5 py-3 text-[11.5px] font-bold text-ink',
                  grid ? 'border border-line text-center' : 'border-b border-line',
                  align(c.align),
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (rowNumbers ? 1 : 0)}
                className="px-3 py-12 text-center text-[13px] text-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className={cn('transition-colors hover:bg-[#FBF9F7]', !grid && 'border-b border-line-soft')}
              >
                {rowNumbers && (
                  <td
                    className={cn(
                      'px-1.5 py-[11px] text-center align-middle text-[11.5px] tabular-nums text-ink-faint',
                      grid && 'border border-line',
                    )}
                  >
                    {startIndex + i + 1}
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-1.5 py-[11px] align-middle text-[12px] text-ink-soft',
                      c.wrap ? 'leading-snug' : 'whitespace-nowrap',
                      grid && 'border border-line',
                      align(c.align),
                      c.className,
                    )}
                  >
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function align(a?: 'left' | 'center' | 'right') {
  return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left'
}

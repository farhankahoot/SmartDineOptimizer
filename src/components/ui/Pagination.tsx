import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Select } from './Field'

export function Pagination({
  page,
  pageCount,
  onPage,
  rowsPerPage,
  onRowsPerPage,
  summary,
}: {
  page: number
  pageCount: number
  onPage: (p: number) => void
  rowsPerPage: number
  onRowsPerPage: (n: number) => void
  summary: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-3.5 lg:flex-row lg:justify-between">
      <p className="text-xs text-ink-muted">{summary}</p>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <PageBtn
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          tone="arrow"
        >
          <ChevronLeft className="size-[15px]" />
        </PageBtn>

        {buildPages(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-ink-faint">
              …
            </span>
          ) : (
            <PageBtn key={p} active={p === page} onClick={() => onPage(p)}>
              {p}
            </PageBtn>
          ),
        )}

        <PageBtn
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => onPage(page + 1)}
          tone="arrow"
        >
          <ChevronRight className="size-[15px]" />
        </PageBtn>
      </nav>

      <div className="flex items-center gap-2.5">
        <span className="whitespace-nowrap text-xs text-ink-muted">Rows per page:</span>
        <Select
          aria-label="Rows per page"
          value={String(rowsPerPage)}
          onChange={(e) => onRowsPerPage(Number(e.target.value))}
          className="h-[34px] w-[76px] text-xs"
          options={[10, 20, 50].map((n) => ({ value: String(n), label: String(n) }))}
        />
      </div>
    </div>
  )
}

function PageBtn({
  active,
  tone,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; tone?: 'arrow' }) {
  return (
    <button
      type="button"
      className={cn(
        'focus-ring inline-flex size-[30px] items-center justify-center rounded-[7px] border text-[13px] font-semibold transition',
        active
          ? 'border-brand-700 bg-brand-700 text-white'
          : tone === 'arrow'
            ? 'border-line bg-white text-brand-600 hover:bg-brand-50 disabled:text-ink-faint disabled:hover:bg-white'
            : 'border-line bg-white text-ink-soft hover:bg-line-soft',
        className,
      )}
      {...rest}
    />
  )
}

/**
 * Mirrors the mockup exactly: a five-page window, an ellipsis, then the last
 * page — "‹ 1 2 3 4 5 … 6 ›" even when the window already touches the end.
 */
function buildPages(page: number, count: number): (number | '…')[] {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1)

  const start = page > 3 ? Math.min(page - 2, count - 5) : 1
  const window = Array.from({ length: 5 }, (_, i) => start + i)

  if (window.includes(count)) return window
  return [...window, '…', count]
}

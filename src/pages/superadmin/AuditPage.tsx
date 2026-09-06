import { useMemo, useState } from 'react'
import { Download, FileText, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Input, Label, Select } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { usePlatform } from '@/store/PlatformContext'
import type { AuditEntry } from '@/data/platform'

const categories = [
  'All categories',
  'User',
  'Restaurant',
  'System',
  'Feature',
  'Content',
  'Security',
  'Reservation',
]

/** Every administrative action, newest first. */
export function AuditPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()
  const { audit } = usePlatform()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [result, setResult] = useState('All results')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return audit.filter(
      (a) =>
        (category === 'All categories' || a.category === category) &&
        (result === 'All results' || a.result === result) &&
        (q === '' ||
          a.action.toLowerCase().includes(q) ||
          a.target.toLowerCase().includes(q) ||
          a.actor.toLowerCase().includes(q)),
    )
  }, [audit, search, category, result])

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * rowsPerPage, current * rowsPerPage)
  const dirty = search !== '' || category !== 'All categories' || result !== 'All results'

  const columns: Column<AuditEntry>[] = [
    { key: 'at', header: 'When', render: (a) => a.at },
    { key: 'actor', header: 'Administrator', className: 'font-semibold text-ink', render: (a) => a.actor },
    { key: 'action', header: 'Action', render: (a) => a.action },
    { key: 'target', header: 'Target', wrap: true, className: 'w-[220px]', render: (a) => a.target },
    {
      key: 'category',
      header: 'Category',
      align: 'center',
      render: (a) => <Badge tone="neutral">{a.category}</Badge>,
    },
    {
      key: 'result',
      header: 'Result',
      align: 'center',
      render: (a) => (
        <Badge tone={a.result === 'Success' ? 'confirmed' : 'cancelled'}>{a.result}</Badge>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Audit Log"
        underline
        onToggleNav={toggle}
        profileName="Super Admin"
        profileRole="Platform"
        action={
          <Button
            variant="outline"
            leftIcon={<Download className="size-[15px]" />}
            onClick={() =>
              push({
                tone: 'info',
                title: 'Export queued',
                detail: 'GET /admin/audit/export would produce the CSV.',
              })
            }
          >
            Export log
          </Button>
        }
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        <div className="flex items-start gap-2.5 rounded-[10px] border border-line bg-white px-4 py-3">
          <FileText className="mt-px size-[17px] shrink-0 text-brand-700" />
          <p className="text-[12.5px] text-ink-soft">
            Administrative actions taken in this session are appended live. Entries are held in
            memory — persist them via{' '}
            <code className="rounded bg-line-soft px-1">POST /admin/audit</code> so the trail
            survives a restart.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="al-search">Search</Label>
              <Input
                id="al-search"
                trailing={<Search />}
                placeholder="Action, target or administrator"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div>
              <Label htmlFor="al-cat">Category</Label>
              <Select
                id="al-cat"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                options={categories.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <Label htmlFor="al-result">Result</Label>
              <Select
                id="al-result"
                value={result}
                onChange={(e) => {
                  setResult(e.target.value)
                  setPage(1)
                }}
                options={['All results', 'Success', 'Failed'].map((c) => ({ value: c, label: c }))}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-6" strokeWidth={1.7} />}
              title="No entries match these filters"
              detail="Try a different category, result or search term."
              action={
                dirty ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearch('')
                      setCategory('All categories')
                      setResult('All results')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={visible}
                rowKey={(a) => a.id}
                minWidth={900}
                startIndex={(current - 1) * rowsPerPage}
              />
              <div className="border-t border-line">
                <Pagination
                  page={current}
                  pageCount={pageCount}
                  onPage={setPage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPage={(n) => {
                    setRowsPerPage(n)
                    setPage(1)
                  }}
                  summary={`Showing ${(current - 1) * rowsPerPage + 1} to ${Math.min(
                    current * rowsPerPage,
                    filtered.length,
                  )} of ${filtered.length} entries`}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

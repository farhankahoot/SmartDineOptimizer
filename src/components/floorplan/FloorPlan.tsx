import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { FloorTable, TableStatus } from '@/data/tables'

type Palette = { body: string; edge: string; chair: string; label: string; shadow: string }

/** Guest floor plan: saturated table bodies with white labels. */
const guestPalette: Record<TableStatus, Palette> = {
  Available: { body: '#6B9E52', edge: '#4E7A3B', chair: '#82B564', label: '#FFFFFF', shadow: 'rgba(50,72,34,.35)' },
  Reserved: { body: '#B03A3A', edge: '#8E2C2C', chair: '#C25252', label: '#FFFFFF', shadow: 'rgba(96,28,28,.35)' },
  Booked: { body: '#B03A3A', edge: '#8E2C2C', chair: '#C25252', label: '#FFFFFF', shadow: 'rgba(96,28,28,.35)' },
  Selected: { body: '#D9A441', edge: '#B98424', chair: '#E4B75F', label: '#FFFFFF', shadow: 'rgba(128,92,20,.35)' },
  Occupied: { body: '#D9A441', edge: '#B98424', chair: '#E4B75F', label: '#FFFFFF', shadow: 'rgba(128,92,20,.35)' },
  Unavailable: { body: '#9E9C97', edge: '#7C7A75', chair: '#ADABA6', label: '#FFFFFF', shadow: 'rgba(70,69,66,.3)' },
  Blocked: { body: '#9E9C97', edge: '#7C7A75', chair: '#ADABA6', label: '#FFFFFF', shadow: 'rgba(70,69,66,.3)' },
}

/** Admin floor plan: pale table tops with dark labels + a status pill. */
const adminPalette: Record<TableStatus, Palette> = {
  Available: { body: '#E4F2DC', edge: '#7FBF5F', chair: '#7FBF5F', label: '#1F2A17', shadow: 'rgba(70,100,45,.22)' },
  Reserved: { body: '#DCE6F7', edge: '#4A78C8', chair: '#4A78C8', label: '#17243A', shadow: 'rgba(40,70,130,.22)' },
  Booked: { body: '#CFDCF2', edge: '#2F5FAE', chair: '#2F5FAE', label: '#12203A', shadow: 'rgba(30,60,120,.24)' },
  Occupied: { body: '#FCEBC4', edge: '#E8A33D', chair: '#E8A33D', label: '#3A2A0C', shadow: 'rgba(140,100,25,.22)' },
  Selected: { body: '#FCEBC4', edge: '#E8A33D', chair: '#E8A33D', label: '#3A2A0C', shadow: 'rgba(140,100,25,.22)' },
  Blocked: { body: '#D3D2CF', edge: '#98969180', chair: '#9A9995', label: '#2F2F2D', shadow: 'rgba(60,60,58,.22)' },
  Unavailable: { body: '#D3D2CF', edge: '#989691', chair: '#9A9995', label: '#2F2F2D', shadow: 'rgba(60,60,58,.22)' },
}

const statusPill: Record<TableStatus, string> = {
  Available: 'bg-state-successBg text-state-success',
  Reserved: 'bg-[#1B62B5] text-white',
  Booked: 'bg-[#123F7E] text-white',
  Occupied: 'bg-[#E8871E] text-white',
  Blocked: 'bg-[#8C8A85] text-white',
  Selected: 'bg-gold-100 text-gold-600',
  Unavailable: 'bg-state-neutralBg text-state-neutral',
}

export function FloorPlan({
  tables,
  variant,
  selectedId,
  onSelect,
  children,
  className,
  aspect = '52%',
}: {
  tables: FloorTable[]
  variant: 'guest' | 'admin'
  selectedId?: string
  onSelect?: (table: FloorTable) => void
  /** Fixed scenery (entrance sign, private room, dividers) layered over the floor. */
  children?: ReactNode
  className?: string
  aspect?: string
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[10px] border-[6px] border-[#4A342A] bg-[#EFE2C8]',
        className,
      )}
      style={{ paddingBottom: aspect }}
    >
      <WoodFloor />

      <div className="absolute inset-0">
        {children}

        {tables.map((t) => (
          <TableNode
            key={t.id}
            table={t}
            variant={variant}
            selected={selectedId === t.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function WoodFloor() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#F3E7D0_0%,#EADCC0_55%,#E3D2B2_100%)]" />
      {/* plank seams */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_21px,rgba(122,92,52,.13)_21px,rgba(122,92,52,.13)_22px)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_74px,rgba(122,92,52,.09)_74px,rgba(122,92,52,.09)_75px)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,.35),transparent_60%)]" />
    </div>
  )
}

function TableNode({
  table,
  variant,
  selected,
  onSelect,
}: {
  table: FloorTable
  variant: 'guest' | 'admin'
  selected: boolean
  onSelect?: (t: FloorTable) => void
}) {
  const p = (variant === 'guest' ? guestPalette : adminPalette)[table.status]
  const interactive = Boolean(onSelect) && table.status !== 'Unavailable' && table.status !== 'Blocked'
  const round = table.shape === 'round'
  const admin = variant === 'admin'

  return (
    <div
      className="absolute"
      style={{ left: `${table.x}%`, top: `${table.y}%`, width: `${table.w}%`, height: `${table.h}%` }}
    >
      <Chairs table={table} color={p.chair} edge={p.edge} />

      <button
        type="button"
        disabled={!interactive}
        aria-pressed={selected}
        aria-label={`Table ${table.id}, ${table.seats} seats, ${table.status}`}
        onClick={() => onSelect?.(table)}
        className={cn(
          'absolute inset-[14%] flex flex-col items-center justify-center border-2 transition',
          round ? 'rounded-full' : 'rounded-[7px]',
          interactive ? 'cursor-pointer hover:brightness-105' : 'cursor-default',
          selected && 'ring-2 ring-gold-400 ring-offset-2 ring-offset-[#EADCC0]',
        )}
        style={{
          background: p.body,
          borderColor: p.edge,
          boxShadow: `0 2px 5px ${p.shadow}`,
          color: p.label,
        }}
      >
        <span
          className={cn(
            'leading-none',
            admin ? 'text-[13px] font-extrabold' : 'text-[13px] font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]',
          )}
        >
          {table.id}
        </span>
        {admin && <span className="mt-0.5 text-[10px] font-medium leading-none">{table.seats} Seats</span>}
      </button>

      {admin && (
        <span
          className={cn(
            'absolute -bottom-[18%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] px-1.5 py-[1px] text-[9.5px] font-bold',
            statusPill[table.status],
          )}
        >
          {table.status}
        </span>
      )}
    </div>
  )
}

/** Chair blocks arranged around the table body according to shape + seat count. */
function Chairs({ table, color, edge }: { table: FloorTable; color: string; edge: string }) {
  const style = { background: color, borderColor: edge }
  const chair = 'absolute rounded-[3px] border'

  if (table.shape === 'round') {
    const n = Math.max(2, table.seats)
    return (
      <div className="absolute inset-0" aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          return (
            <span
              key={i}
              className={cn(chair, 'size-[22%]')}
              style={{
                ...style,
                left: `${50 + Math.cos(angle) * 40 - 11}%`,
                top: `${50 + Math.sin(angle) * 40 - 11}%`,
                borderRadius: '5px',
              }}
            />
          )
        })}
      </div>
    )
  }

  // Rectangles seat along the long sides; squares seat two per side.
  const perSide = Math.max(1, Math.round(table.seats / 2))
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {Array.from({ length: perSide }).map((_, i) => {
        const pos = ((i + 1) / (perSide + 1)) * 100
        return (
          <span key={`t-${i}`} className={cn(chair, 'h-[16%] w-[18%]')} style={{ ...style, left: `${pos - 9}%`, top: '1%' }} />
        )
      })}
      {Array.from({ length: perSide }).map((_, i) => {
        const pos = ((i + 1) / (perSide + 1)) * 100
        return (
          <span key={`b-${i}`} className={cn(chair, 'h-[16%] w-[18%]')} style={{ ...style, left: `${pos - 9}%`, bottom: '1%' }} />
        )
      })}
      <span className={cn(chair, 'h-[26%] w-[9%]')} style={{ ...style, left: '0.5%', top: '37%' }} />
      <span className={cn(chair, 'h-[26%] w-[9%]')} style={{ ...style, right: '0.5%', top: '37%' }} />
    </div>
  )
}

/* ---------------------------------------------------------------- scenery */

export function EntranceSign({ left = '43%', top = '0%' }: { left?: string; top?: string }) {
  return (
    <div
      className="absolute flex flex-col items-center rounded-[4px] border border-[#4A342A]/25 bg-[#FBF6EC] px-2.5 py-1 shadow-sm"
      style={{ left, top }}
    >
      <span className="text-[9.5px] font-bold tracking-[0.06em] text-[#3A2B22]">ENTRANCE</span>
      <svg width="12" height="12" viewBox="0 0 12 12" className="mt-0.5" aria-hidden="true">
        <path d="M6 1v8M2.5 6.5 6 10l3.5-3.5" stroke="#3A2B22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function PrivateRoom({
  label = 'PRIVATE ROOM',
  style,
}: {
  label?: string
  style: React.CSSProperties
}) {
  return (
    <div
      className="absolute rounded-[4px] border-[5px] border-[#4A342A] bg-[linear-gradient(180deg,#F1E4CC,#E6D5B4)]"
      style={style}
    >
      <span className="absolute inset-x-0 top-2 text-center text-[10px] font-bold tracking-[0.05em] text-[#3A2B22]">
        {label}
      </span>
    </div>
  )
}

/** Interior partition wall. */
export function Wall({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-[2px] bg-[#4A342A]" style={style} />
}

/** Potted greenery dotted around the room edges. */
export function Plant({ style, size = 22 }: { style: React.CSSProperties; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="absolute"
      style={style}
      aria-hidden="true"
    >
      <g fill="#5E8C42">
        <path d="M12 20c-1-4-4-6-7-6 3-1 6 0 7 3 0-4 2-7 5-8-2 3-3 6-3 9 1-2 3-3 5-3-2 1-4 3-5 5z" />
        <path d="M12 20c1-5 4-8 8-9-3 3-5 6-6 9z" opacity=".8" />
      </g>
      <path d="M8 19h8l-1.2 4H9.2z" fill="#8C6239" />
    </svg>
  )
}

/** Long planter box used as a room divider in the guest floor plan. */
export function Planter({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute overflow-hidden rounded-[3px] border border-[#5A4030] bg-[#6B4A32]"
      style={style}
    >
      <div className="flex h-full items-center justify-around px-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <svg key={i} viewBox="0 0 10 10" className="h-[70%]" aria-hidden="true">
            <path d="M5 9V4M5 4 2 1M5 4l3-3M5 6 2.5 4M5 6l2.5-2" stroke="#6F9E4A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        ))}
      </div>
    </div>
  )
}

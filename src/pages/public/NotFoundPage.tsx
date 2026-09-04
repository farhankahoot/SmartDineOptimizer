import { Link } from 'react-router-dom'
import { CalendarSearch, Home, LayoutGrid } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-page px-5 py-16 text-center">
      <div className="rounded-[12px] bg-sidebar px-5 py-4">
        <BrandLogo scale={0.9} />
      </div>

      <p className="mt-8 text-[48px] font-extrabold leading-none tracking-[-0.03em] text-brand-700">
        404
      </p>
      <h1 className="mt-3 text-[20px] font-extrabold text-ink">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-[420px] text-[13px] text-ink-muted">
        The link may be out of date, or the page was moved. Try one of these instead.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link to="/reserve">
          <Button size="lg" leftIcon={<Home className="size-[16px]" />}>
            Book a table
          </Button>
        </Link>
        <Link to="/track">
          <Button size="lg" variant="outline" leftIcon={<CalendarSearch className="size-[16px]" />}>
            Track a booking
          </Button>
        </Link>
        <Link to="/admin">
          <Button size="lg" variant="outlineNeutral" leftIcon={<LayoutGrid className="size-[16px]" />}>
            Admin console
          </Button>
        </Link>
      </div>
    </div>
  )
}

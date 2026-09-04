import { Link } from 'react-router-dom'
import { LogIn, Phone, Wrench } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/Button'
import { useSystem } from '@/store/SystemContext'
import { defaultProfile } from '@/data/settings'

/**
 * Shown on guest-facing routes while an administrator has the system in
 * maintenance mode. The console stays reachable so staff can bring it back up.
 */
export function MaintenancePage() {
  const { system } = useSystem()

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#0C0C0E] px-5 py-16 text-center">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(60% 55% at 20% 10%, rgba(122,17,19,.5) 0%, transparent 62%), radial-gradient(45% 45% at 85% 85%, rgba(212,165,55,.14) 0%, transparent 60%)',
        }}
      />

      <div className="relative">
        <BrandLogo scale={1.05} />

        <span className="mx-auto mt-9 flex size-14 items-center justify-center rounded-full border border-gold-600/40 text-gold-400">
          <Wrench className="size-7" strokeWidth={1.8} />
        </span>

        <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.02em] text-white sm:text-[32px]">
          We&apos;ll be back shortly
        </h1>
        <p className="mx-auto mt-3 max-w-[460px] text-[14px] leading-relaxed text-white/70">
          {system.maintenanceMessage}
        </p>

        {system.maintenanceEta.trim() && (
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-gold-600/40 px-3.5 py-1.5 text-[12px] font-semibold text-gold-300">
            Expected back: {system.maintenanceEta}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={`tel:${defaultProfile.phone.replace(/\s/g, '')}`} className="w-full sm:w-auto">
            <Button size="lg" block leftIcon={<Phone className="size-[16px]" />}>
              Call {defaultProfile.phone}
            </Button>
          </a>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              block
              variant="outlineNeutral"
              className="border-white/25 bg-white/[0.04] text-white hover:bg-white/10"
              leftIcon={<LogIn className="size-[16px]" />}
            >
              Staff log in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

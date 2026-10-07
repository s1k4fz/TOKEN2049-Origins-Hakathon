import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useBountiesQuery } from '@/features/bounty'
import { useMessages } from '@/hooks/useMessages'
import { formatSolCompact } from '@/lib/format'
import { EnclaveAnimation } from './EnclaveAnimation'

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] tracking-wider text-zinc-400 uppercase">{label}</p>
      <p className="mt-1 truncate text-[17px] font-semibold text-zinc-900">{value}</p>
    </div>
  )
}

export function LandingHero() {
  const m = useMessages()
  const text = m.landing.hero
  const bounty = useBountiesQuery().data?.[0]

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="landing-dots absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-8 px-6 pt-10 pb-16 lg:grid-cols-[0.9fr_1.1fr] lg:pt-8">
        <div className="animate-in duration-700 fade-in-0 slide-in-from-bottom-2">
          <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 text-[12.5px] font-medium text-zinc-600">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {text.badge}
          </span>
          <h1 className="mt-6 text-[44px] leading-[1.05] font-semibold tracking-[-0.035em] text-zinc-950 sm:text-[60px]">
            {text.titleLine1}
            <br />
            <span className="text-zinc-400">{text.titleLine2}</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-[28px] text-zinc-600">{text.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 gap-2 rounded-full bg-zinc-950 px-5 text-[15px] font-normal text-white hover:bg-zinc-800"
            >
              <Link to="/submit">
                {text.primary}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-zinc-300 bg-transparent px-5 text-[15px] font-normal text-zinc-800 hover:bg-zinc-100"
            >
              <Link to="/protect">{text.secondary}</Link>
            </Button>
          </div>
          <div className="mt-12 grid max-w-[30rem] grid-cols-3 gap-6 border-t border-zinc-200 pt-6">
            <HeroStat label={text.statBounty} value={bounty ? formatSolCompact(bounty.amountLamports) : '—'} />
            <HeroStat
              label={text.statInvariant}
              value={bounty ? text.statInvariantValue(formatSolCompact(bounty.thresholdLamports)) : '—'}
            />
            <HeroStat label={text.statSettle} value={text.statSettleValue} />
          </div>
        </div>

        <EnclaveAnimation
          text={`+${bounty ? formatSolCompact(bounty.amountLamports) : '0.1 SOL'}`}
          className="h-[400px] animate-in delay-150 duration-700 fade-in-0 sm:h-[500px] lg:-mr-24 lg:h-[580px]"
        />
      </div>
    </section>
  )
}

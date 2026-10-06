import { formatSol, formatSolCompact, shortAddress } from '@/lib/format'
import type { Claim } from '@/types/claim'
import type { ClaimProgress } from './claimProgress'

function ResultStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white/60 px-3 py-4">
      <div className="text-2xl font-semibold text-zinc-950">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  )
}

export function ClaimResultStats({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const { settled } = progress
  if (progress.outcome !== 'paid' || !settled) return null

  return (
    <section className="grid w-full max-w-[40rem] animate-in grid-cols-3 gap-3 text-center duration-500 fade-in-0 slide-in-from-bottom-1.5">
      <ResultStat
        value={`+${formatSolCompact(settled.payoutDeltaLamports)}`}
        label={`Paid to ${shortAddress(claim.payout)}`}
      />
      <ResultStat value={settled.vaultPaused ? 'Paused' : 'Live'} label="Vault paused in the same tx" />
      <ResultStat value={formatSol(settled.vaultBalanceLamports)} label="Vault balance unchanged" />
    </section>
  )
}

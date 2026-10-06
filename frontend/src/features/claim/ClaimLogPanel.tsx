import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import { Capsule } from '@/components/Capsule'
import { formatSol, formatSolCompact, shortAddress } from '@/lib/format'
import type { Claim } from '@/types/claim'
import type { ClaimProgress } from './claimProgress'

function ReportFields({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const { outcome, measured, reported } = progress

  if (!reported || !measured) {
    const message =
      outcome === 'rejected'
        ? 'Nothing. The invariant held, so no report was produced.'
        : outcome === 'failed'
          ? 'Nothing. Verification stopped before a report was produced.'
          : 'Only six fields can leave: two balances, the slot, the threshold, your payout address and the vault.'
    return <p className="mt-1.5 text-[12.5px] leading-[18px] text-zinc-400">{message}</p>
  }

  const fields = [
    { label: 'pre', value: formatSol(measured.preLamports) },
    { label: 'post', value: formatSol(measured.postLamports) },
    { label: 'slot', value: measured.slot.toLocaleString('en-US') },
    { label: 'threshold', value: formatSolCompact(measured.thresholdLamports) },
    { label: 'payout', value: shortAddress(claim.payout) },
    { label: 'vault', value: shortAddress(claim.vault) },
  ]

  return (
    <>
      <div className="mt-2 grid animate-in grid-cols-2 gap-1.5 duration-500 fade-in-0">
        {fields.map((field) => (
          <div key={field.label} className="rounded-[10px] bg-zinc-100 px-2.5 py-1.5">
            <p className="text-[11px] leading-4 text-zinc-400">{field.label}</p>
            <p className="truncate font-mono text-[12px] leading-[18px] text-zinc-800">{field.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] leading-[18px] text-zinc-400">Your exploit transaction is not in the report.</p>
    </>
  )
}

/** 右侧面板：脱敏后的验证日志 + 最终离开飞地的报告字段，沿用学习点页右栏的版式。 */
export function ClaimLogPanel({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lineCount = progress.logs.length

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [lineCount])

  return (
    <aside className="flex w-82 shrink-0 flex-col rounded-md border border-zinc-200/80 bg-zinc-50 p-3">
      <div className="-mt-1 flex h-7 shrink-0 items-center gap-2">
        <Terminal className="size-4 shrink-0 text-zinc-600" />
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-zinc-800">Verification log</span>
        <Capsule>Redacted</Capsule>
      </div>

      <div ref={scrollRef} className="scrollbar-fade -mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1">
        {lineCount === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">Waiting for the workflow…</p>
        ) : (
          <div className="flex flex-col gap-1.5 pb-2">
            {progress.logs.map((line, index) => (
              <p
                key={`${index}-${line}`}
                className="animate-in font-mono text-[11.5px] leading-[18px] break-words whitespace-pre-wrap text-zinc-500 duration-300 fade-in-0"
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <section className="mt-3 shrink-0 rounded-[18px] border border-zinc-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-medium text-zinc-800">What leaves the enclave</h2>
          {progress.reported ? (
            <span className="font-mono text-[12px] text-zinc-400">{progress.reported.reportHex.length / 2} bytes</span>
          ) : null}
        </div>
        <ReportFields claim={claim} progress={progress} />
      </section>
    </aside>
  )
}

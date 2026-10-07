import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '@/components/CircularProgress'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import { explorerAddressUrl } from '@/lib/explorer'
import { formatSolCompact, shortAddress } from '@/lib/format'
import type { Messages } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Bounty } from '@/types/bounty'
import { BountyCover } from './BountyCover'
import { getProtectionProgress } from './bountyStatus'

const iconButtonClassName =
  'size-7 rounded-full border border-zinc-200 bg-transparent text-zinc-500 hover:bg-transparent hover:text-zinc-800'

function summarizeLatest(bounty: Bounty, m: Messages): string {
  const latest = bounty.latestSubmission
  if (!latest) return m.common.noSubmissions
  if (latest.outcome === 'paid') {
    return m.bounty.latestSummary.paid(formatSolCompact(bounty.amountLamports), shortAddress(latest.payout))
  }
  return m.bounty.latestSummary[latest.outcome]
}

export function BountyCard({ bounty, className }: { bounty: Bounty; className?: string }) {
  const m = useMessages()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyVaultAddress = async () => {
    await navigator.clipboard.writeText(bounty.vault)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={cn(
        'relative flex h-[236px] flex-col items-start rounded-[20px] border border-zinc-200/80 pt-3 pb-3 pl-3',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-1/4 bottom-3 border-l border-dashed border-zinc-300"
      />

      <div className="absolute top-6 right-4 left-[calc(75%+16px)]">
        <p className="text-[13px] leading-[18px] font-medium text-zinc-400">{m.bounty.card.latest}</p>
        <p className="mt-1 line-clamp-4 text-[15px] leading-[21px] font-semibold text-zinc-900">
          {summarizeLatest(bounty, m)}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate(`/bounties/${bounty.id}`)}
        className="absolute right-4 bottom-[43px] h-8 rounded-full border border-zinc-300 bg-transparent px-3 text-[13px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-transparent hover:text-zinc-900"
      >
        {m.bounty.card.viewProgram}
      </Button>

      <div className="absolute top-6 right-[calc(25%+16px)] left-[204px]">
        <p className="text-[12px] leading-4 font-medium text-zinc-400">{m.bounty.card.program}</p>
        <h2 className="mt-0.5 line-clamp-2 text-[20px] leading-[26px] font-bold tracking-[-0.015em] text-zinc-900">
          {bounty.name}
        </h2>
        <div className="mt-3 flex gap-2">
          <span className="flex h-6 items-center gap-[4px] rounded-full border border-zinc-300 pr-2 pl-[3px]">
            <CircularProgress value={getProtectionProgress(bounty)} size={15} strokeWidth={2.5} />
            <span className="-translate-y-[0.1px] text-[12.5px] font-semibold whitespace-nowrap text-zinc-600">
              {m.bounty.card.protection}
            </span>
          </span>
          <span className="flex h-6 items-center gap-[4px] rounded-full border border-zinc-300 pr-2 pl-[3px]">
            <CircularProgress
              value={bounty.status === 'paid' ? 100 : 0}
              size={15}
              strokeWidth={2.5}
              progressColor="#eab308"
            />
            <span className="-translate-y-[0.1px] text-[12.5px] font-semibold whitespace-nowrap text-zinc-600">
              {m.bounty.status[bounty.status]}
            </span>
          </span>
        </div>
      </div>

      <div className="absolute right-[calc(25%+16px)] bottom-12 left-[204px] grid grid-cols-[auto_minmax(0,1fr)] gap-x-7">
        <div className="min-w-0">
          <p className="text-[13px] leading-[18px] font-medium text-zinc-400">{m.bounty.card.maxBounty}</p>
          <p className="mt-0.5 truncate text-[16px] leading-[22px] font-semibold text-zinc-800">
            {formatSolCompact(bounty.amountLamports)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] leading-[18px] font-medium text-zinc-400">{m.bounty.card.invariant}</p>
          <p className="mt-0.5 truncate text-[16px] leading-[22px] font-semibold text-zinc-800">
            {m.bounty.card.balanceAtLeast(formatSolCompact(bounty.thresholdLamports))}
          </p>
        </div>
      </div>

      <BountyCover className="size-[176px] rounded-[14px]" iconClassName="size-14" />

      <div className="mt-auto flex w-[176px] items-center justify-center gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={m.bounty.card.copyVault}
          onClick={copyVaultAddress}
          className={iconButtonClassName}
        >
          {copied ? <Check className="size-[14px]" /> : <Copy className="size-[14px]" />}
        </Button>
        <Button
          asChild
          variant="ghost"
          size="icon-xs"
          aria-label={m.bounty.card.openExplorer}
          className={iconButtonClassName}
        >
          <a href={explorerAddressUrl(bounty.vault)} target="_blank" rel="noreferrer">
            <ExternalLink className="size-[14px]" />
          </a>
        </Button>
      </div>
    </div>
  )
}

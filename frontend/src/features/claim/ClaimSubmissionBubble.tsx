import { Lock } from 'lucide-react'
import { formatTime, shortAddress, shortHash } from '@/lib/format'
import type { Claim } from '@/types/claim'

/** 右对齐的"用户消息"：只展示密封摘要，不展示交易原文。 */
export function ClaimSubmissionBubble({ claim }: { claim: Claim }) {
  return (
    <div className="flex w-full flex-col items-end gap-1.5">
      <div className="max-w-[80%] rounded-[18px] bg-zinc-100 px-4 py-2.5 text-base leading-7 text-foreground [overflow-wrap:anywhere]">
        <p className="flex items-center gap-2">
          <Lock className="size-4 shrink-0" strokeWidth={2} />
          <span>
            Sealed exploit · {claim.txBytes} bytes ·{' '}
            <span className="font-mono text-[14px]">sha256 {shortHash(claim.txSha256)}</span>
          </span>
        </p>
        <p className="text-[14px] leading-6 text-zinc-500">
          Target {claim.bountyName} · payout <span className="font-mono">{shortAddress(claim.payout)}</span>
        </p>
      </div>
      <span className="px-2 text-[12px] text-zinc-400">
        {claim.id} · {formatTime(claim.createdAt)}
      </span>
    </div>
  )
}

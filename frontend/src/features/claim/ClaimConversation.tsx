import { useEffect, useRef } from 'react'
import { NetworkStatus } from '@/components/NetworkStatus'
import type { Claim } from '@/types/claim'
import { ClaimResultStats } from './ClaimResultStats'
import { ClaimSubmissionBubble } from './ClaimSubmissionBubble'
import { ClaimVerificationCard } from './ClaimVerificationCard'
import { getClaimProgress } from './claimProgress'
import { useClaimClock } from './useClaimClock'

/** 验证过程页主体：沿用对话页版式，提交摘要在右，验证卡片在左。 */
export function ClaimConversation({ claim }: { claim: Claim }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useClaimClock([claim])
  const progress = getClaimProgress(claim, now)
  const stageCount = progress.stages.length

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined
    // 等阶段内容的高度动画走完再滚到底，让结果统计露出来。
    const timer = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 550)
    return () => clearTimeout(timer)
  }, [stageCount, progress.outcome])

  return (
    <div className="relative flex h-full flex-col rounded-md border border-zinc-200/80 bg-zinc-50">
      <div className="absolute top-3.75 right-3.75 z-10">
        <NetworkStatus />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col pt-16">
        <div ref={scrollRef} className="scrollbar-fade min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[55rem] flex-col gap-6 px-6 pb-24">
            <ClaimSubmissionBubble claim={claim} />
            <ClaimVerificationCard claim={claim} progress={progress} />
            <ClaimResultStats claim={claim} progress={progress} />
          </div>
        </div>
      </div>
    </div>
  )
}

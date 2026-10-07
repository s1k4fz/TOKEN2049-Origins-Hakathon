import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NetworkStatus } from '@/components/NetworkStatus'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import type { Claim } from '@/types/claim'
import { ClaimLogPanel } from './ClaimLogPanel'
import { ClaimResultStats } from './ClaimResultStats'
import { ClaimSubmissionBubble } from './ClaimSubmissionBubble'
import { ClaimVerificationCard } from './ClaimVerificationCard'
import { getClaimProgress } from './claimProgress'
import { useClaimClock } from './useClaimClock'

/** 验证过程页主体：沿用学习点页的双栏外壳，左栏是验证卡片，右栏是日志面板。 */
export function ClaimView({ claim }: { claim: Claim }) {
  const m = useMessages()
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
  }, [stageCount, progress.phase, progress.outcome])

  return (
    <div className="flex h-full gap-2">
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200/80 bg-zinc-50">
        <div ref={scrollRef} className="scrollbar-fade h-full min-h-0 overflow-y-auto px-4 pt-8 pb-14">
          <article className="mx-auto flex w-full max-w-[44rem] flex-col">
            <div className="flex items-center justify-between gap-4">
              <h1 className="min-w-0 text-[32px] leading-10 font-semibold tracking-tight text-zinc-950">
                {m.claim.title(claim.id)}
              </h1>
              <div className="flex shrink-0 items-center gap-3">
                <NetworkStatus />
                <Button
                  asChild
                  variant="outline"
                  className="h-9 shrink-0 rounded-full border-zinc-300 bg-transparent px-4 font-normal text-zinc-700 hover:bg-accent hover:text-accent-foreground"
                >
                  <Link to={`/bounties/${claim.bountyId}`}>
                    <ArrowLeft className="size-3.5" />
                    {m.common.backToBounty}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              <ClaimSubmissionBubble claim={claim} />
              <ClaimVerificationCard claim={claim} progress={progress} />
              <ClaimResultStats claim={claim} progress={progress} />
            </div>
          </article>
        </div>
      </main>
      <ClaimLogPanel claim={claim} progress={progress} />
    </div>
  )
}

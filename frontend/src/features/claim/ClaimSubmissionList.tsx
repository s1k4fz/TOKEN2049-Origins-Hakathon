import { useNavigate } from 'react-router-dom'
import { ProgressStatusIcon, type ProgressStatus } from '@/components/ProgressStatusIcon'
import { Skeleton } from '@/components/ui/skeleton'
import { formatShortDate, shortAddress } from '@/lib/format'
import type { Claim } from '@/types/claim'
import { useClaimsQuery } from './claimApi'
import { getClaimProgress, getClaimStatusLabel, type ClaimOutcome } from './claimProgress'
import { useClaimClock } from './useClaimClock'

const NO_CLAIMS: Claim[] = []

const outcomeIcon: Record<ClaimOutcome, ProgressStatus> = {
  running: 'in-progress',
  paid: 'completed',
  rejected: 'failed',
  failed: 'failed',
}

/** 项目方视角的收件箱：某个程序收到的全部提交。 */
export function ClaimSubmissionList({ bountyId }: { bountyId: string }) {
  const navigate = useNavigate()
  const claimsQuery = useClaimsQuery()
  const claims = (claimsQuery.data ?? NO_CLAIMS).filter((claim) => claim.bountyId === bountyId)
  const now = useClaimClock(claims)

  if (claimsQuery.isPending) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
      </div>
    )
  }

  if (claimsQuery.isError) {
    return <p className="p-3 text-sm text-muted-foreground">Failed to load submissions</p>
  }

  if (claims.length === 0) {
    return <p className="p-3 text-sm text-muted-foreground">No submissions yet</p>
  }

  return (
    <ol className="divide-y divide-border">
      {claims.map((claim) => {
        const progress = getClaimProgress(claim, now)
        return (
          <li
            key={claim.id}
            className="flex min-h-16 cursor-pointer items-center gap-3 p-3 hover:bg-muted/50"
            onClick={() => navigate(`/claims/${claim.id}`)}
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              <ProgressStatusIcon status={outcomeIcon[progress.outcome]} />
            </span>
            <div className="min-w-0 grow">
              <p className="truncate text-sm font-medium">
                {claim.id} · payout <span className="font-mono">{shortAddress(claim.payout)}</span>
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {getClaimStatusLabel(progress)} · {claim.txBytes}-byte sealed transaction
              </p>
            </div>
            <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">
              {formatShortDate(claim.createdAt)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

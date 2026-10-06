import { SidebarItem } from '@/components/SidebarItem'
import { SidebarSection } from '@/components/SidebarSection'
import { Skeleton } from '@/components/ui/skeleton'
import type { Claim } from '@/types/claim'
import { useClaimsQuery } from './claimApi'
import { getClaimProgress, getClaimStatusLabel } from './claimProgress'
import { useClaimClock } from './useClaimClock'

const NO_CLAIMS: Claim[] = []

export function ClaimSidebarList() {
  const claimsQuery = useClaimsQuery()
  const claims = claimsQuery.data ?? NO_CLAIMS
  const now = useClaimClock(claims)

  return (
    <SidebarSection title="Submissions" forceClosed={claimsQuery.isPending} showLine={false}>
      {claimsQuery.isPending ? (
        <div className="flex flex-col gap-2 px-3 py-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : claimsQuery.isError ? (
        <p className="px-3 py-1.5 text-sm text-zinc-400">Failed to load</p>
      ) : claims.length === 0 ? (
        <p className="px-3 py-1.5 text-sm text-zinc-400">No submissions yet</p>
      ) : (
        claims.map((claim) => (
          <SidebarItem
            key={claim.id}
            label={`Claim · ${getClaimStatusLabel(getClaimProgress(claim, now))}`}
            to={`/claims/${claim.id}`}
          />
        ))
      )}
    </SidebarSection>
  )
}

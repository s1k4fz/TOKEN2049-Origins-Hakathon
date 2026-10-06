import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BountyCard } from './BountyCard'
import { useBountiesQuery } from './bountyApi'
import { emptyTabNotice, filterBounties, type BountyListTab } from './bountyFilters'

function BountyListNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[236px] items-center justify-center rounded-[20px] border border-dashed border-zinc-300 text-[14px] text-zinc-400">
      {children}
    </div>
  )
}

export function BountyList({
  activeTab,
  searchTerm,
  className,
}: {
  activeTab: BountyListTab
  searchTerm: string
  className?: string
}) {
  const bountiesQuery = useBountiesQuery()

  if (bountiesQuery.isPending) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <Skeleton className="h-[236px] rounded-[20px]" />
      </div>
    )
  }

  if (bountiesQuery.isError) {
    return (
      <div className={className}>
        <BountyListNotice>Failed to load programs</BountyListNotice>
      </div>
    )
  }

  const bounties = filterBounties(bountiesQuery.data, activeTab, searchTerm)
  if (bounties.length === 0) {
    return (
      <div className={className}>
        <BountyListNotice>
          {searchTerm.trim() !== '' ? 'No matching programs' : emptyTabNotice[activeTab]}
        </BountyListNotice>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {bounties.map((bounty) => (
        <BountyCard key={bounty.id} bounty={bounty} />
      ))}
    </div>
  )
}

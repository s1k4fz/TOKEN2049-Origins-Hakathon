import { FolderOpen } from 'lucide-react'
import { SidebarItem } from '@/components/SidebarItem'
import { SidebarSection } from '@/components/SidebarSection'
import { Skeleton } from '@/components/ui/skeleton'
import { useBountiesQuery } from './bountyApi'

export function BountySidebarList() {
  const bountiesQuery = useBountiesQuery()

  return (
    <SidebarSection title="Programs" forceClosed={bountiesQuery.isPending}>
      {bountiesQuery.isPending ? (
        <div className="flex flex-col gap-2 px-3 py-1.5">
          <Skeleton className="h-5 w-full" />
        </div>
      ) : bountiesQuery.isError ? (
        <p className="px-3 py-1.5 text-sm text-zinc-400">Failed to load</p>
      ) : (
        bountiesQuery.data.map((bounty) => (
          <SidebarItem key={bounty.id} icon={FolderOpen} label={bounty.name} to={`/bounties/${bounty.id}`} />
        ))
      )}
    </SidebarSection>
  )
}

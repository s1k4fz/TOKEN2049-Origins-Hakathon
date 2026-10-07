import { type CSSProperties } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import { cn } from '@/lib/utils'
import { bountyListTabs, type BountyListTab } from './bountyFilters'

const BOUNTIES_TOOLBAR_STYLE = {
  // 搜索框与 Tab 组的水平间距；增大时搜索框向右移动。
  '--bounties-search-gap': '120px',
  '--bounties-search-width': '300px',
} as CSSProperties

export function BountiesTabs({
  activeTab,
  onActiveTabChange,
  searchTerm,
  onSearchTermChange,
}: {
  activeTab: BountyListTab
  onActiveTabChange: (tab: BountyListTab) => void
  searchTerm: string
  onSearchTermChange: (term: string) => void
}) {
  const m = useMessages()

  return (
    <div
      style={BOUNTIES_TOOLBAR_STYLE}
      className="flex min-h-15 w-full flex-col gap-4 py-2 md:flex-row md:flex-nowrap md:items-center md:gap-0"
    >
      <div role="tablist" aria-label={m.bounty.tabsAria} className="flex shrink-0 flex-nowrap items-center gap-2">
        {bountyListTabs.map((tab) => (
          <Button
            key={tab}
            type="button"
            role="tab"
            variant="ghost"
            aria-selected={activeTab === tab}
            className={cn(
              'rounded-full bg-transparent px-4 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground',
              activeTab === tab && 'bg-muted text-foreground hover:bg-muted hover:text-foreground'
            )}
            onClick={() => onActiveTabChange(tab)}
          >
            {m.bounty.tabs[tab]}
          </Button>
        ))}
      </div>

      <div className="w-full min-w-0 md:ml-[var(--bounties-search-gap)] md:w-[var(--bounties-search-width)] md:flex-none">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <input
            id="bounties-search-input"
            type="text"
            autoComplete="off"
            aria-label={m.bounty.searchPlaceholder}
            placeholder={m.bounty.searchPlaceholder}
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            className="h-[34px] w-full rounded-full border border-zinc-200 bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus:border-zinc-300"
          />
        </div>
      </div>
    </div>
  )
}

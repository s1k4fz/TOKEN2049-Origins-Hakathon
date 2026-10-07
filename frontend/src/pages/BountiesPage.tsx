import { useState, type CSSProperties } from 'react'
import { NetworkStatus } from '@/components/NetworkStatus'
import { BountiesTabs, BountyList, type BountyListTab } from '@/features/bounty'
import { ClaimWeeklyCard } from '@/features/claim'
import { useMessages } from '@/hooks/useMessages'

const BOUNTIES_LAYOUT_STYLE = {
  // 标题与整个 Tab 组共用的左边距；增大向右，减小向左。
  '--bounties-left-space': '90px',
  '--bounties-right-space': '24px',
  '--bounties-top-space': '72px',
  '--bounties-bottom-space': '32px',
  '--bounties-title-tabs-gap': '20px',
  '--bounties-weekly-card-top': '64px',
  // 周统计卡下边缘与左侧第一张卡片下边缘齐平：标题 34 + 间距 + Tab 60 + 列表上边距 8 + 卡片 236 - 自身上边距。
  '--bounties-weekly-card-height':
    'calc(34px + var(--bounties-title-tabs-gap) + 60px + 8px + 236px - var(--bounties-weekly-card-top))',
} as CSSProperties

export function BountiesPage() {
  const m = useMessages()
  const [activeTab, setActiveTab] = useState<BountyListTab>('all')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="relative h-full overflow-y-auto rounded-md border border-zinc-200/80 bg-zinc-50">
      <div className="absolute top-4 right-4">
        <NetworkStatus />
      </div>
      <main className="min-h-full">
        <div
          style={BOUNTIES_LAYOUT_STYLE}
          className="flex w-full flex-col pt-[var(--bounties-top-space)] pr-[var(--bounties-right-space)] pb-[var(--bounties-bottom-space)] pl-[var(--bounties-left-space)]"
        >
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 className="text-[28px] leading-[34px] font-medium text-foreground">{m.nav.bounties}</h1>
              <div className="mt-[var(--bounties-title-tabs-gap)] flex w-full max-w-[644px] flex-1 flex-col">
                <BountiesTabs
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                />
                <BountyList activeTab={activeTab} searchTerm={searchTerm} className="mt-2" />
              </div>
            </div>

            <ClaimWeeklyCard className="w-full max-w-[330px] xl:mt-[var(--bounties-weekly-card-top)] xl:mr-[44px] xl:h-[var(--bounties-weekly-card-height)] xl:w-[330px] xl:shrink-0" />
          </div>
        </div>
      </main>
    </div>
  )
}

import type { Bounty } from '@/types/bounty'

export type BountyListTab = 'all' | 'active' | 'paid'

export const bountyListTabs: BountyListTab[] = ['all', 'active', 'paid']

export function filterBounties(bounties: Bounty[], tab: BountyListTab, searchTerm: string): Bounty[] {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  return bounties.filter((bounty) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'active' && (bounty.status === 'active' || bounty.status === 'cancel_pending')) ||
      (tab === 'paid' && bounty.status === 'paid')
    const matchesSearch = normalizedSearch.length === 0 || bounty.name.toLowerCase().includes(normalizedSearch)
    return matchesTab && matchesSearch
  })
}

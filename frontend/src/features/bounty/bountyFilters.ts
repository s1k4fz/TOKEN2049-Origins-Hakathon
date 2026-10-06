import type { Bounty } from '@/types/bounty'

export type BountyListTab = 'all' | 'active' | 'paid'

export const bountyListTabs: Array<{ value: BountyListTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paid', label: 'Paid' },
]

export const emptyTabNotice: Record<BountyListTab, string> = {
  all: 'No protected programs yet',
  active: 'No active bounties',
  paid: 'No bounty has been paid yet',
}

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

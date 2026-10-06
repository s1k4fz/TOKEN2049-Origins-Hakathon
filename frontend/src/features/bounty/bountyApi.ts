import { useQuery } from '@tanstack/react-query'
import { getMockBounty, listMockBounties } from '@/mock/bounties'
import { mockResponse } from '@/mock/mockResponse'

// 链上状态会被结算交易改变（暂停、余额、赏金状态），所以持续轮询。
const BOUNTY_REFETCH_INTERVAL_MS = 2_000

export const bountyKeys = {
  all: ['bounties'] as const,
  detail: (id: string) => ['bounties', id] as const,
}

export function useBountiesQuery() {
  return useQuery({
    queryKey: bountyKeys.all,
    queryFn: () => mockResponse(listMockBounties),
    refetchInterval: BOUNTY_REFETCH_INTERVAL_MS,
  })
}

export function useBountyQuery(id: string | undefined) {
  return useQuery({
    queryKey: bountyKeys.detail(id ?? ''),
    queryFn: () => mockResponse(() => getMockBounty(id ?? '')),
    enabled: Boolean(id),
    refetchInterval: BOUNTY_REFETCH_INTERVAL_MS,
  })
}

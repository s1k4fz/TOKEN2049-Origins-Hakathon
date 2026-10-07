import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/http'
import type { Bounty } from '@/types/bounty'

// 链上状态会被结算交易改变（暂停、余额、赏金状态），所以持续轮询。
const BOUNTY_REFETCH_INTERVAL_MS = 3_000

export const bountyKeys = {
  all: ['bounties'] as const,
  detail: (id: string) => ['bounties', id] as const,
}

export function useBountiesQuery() {
  return useQuery({
    queryKey: bountyKeys.all,
    queryFn: async () => (await http.get<Bounty[]>('/bounties')).data,
    refetchInterval: BOUNTY_REFETCH_INTERVAL_MS,
  })
}

export function useBountyQuery(id: string | undefined) {
  return useQuery({
    queryKey: bountyKeys.detail(id ?? ''),
    queryFn: async () => (await http.get<Bounty>(`/bounties/${id}`)).data,
    enabled: Boolean(id),
    refetchInterval: BOUNTY_REFETCH_INTERVAL_MS,
  })
}

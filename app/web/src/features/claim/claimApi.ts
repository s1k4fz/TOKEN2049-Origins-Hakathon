import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bountyKeys } from '@/features/bounty'
import { http } from '@/lib/http'
import type { Claim, CreateClaimInput } from '@/types/claim'

export const claimKeys = {
  all: ['claims'] as const,
  detail: (id: string) => ['claims', id] as const,
}

export type SampleTxMode = 'exploit' | 'honest'

export interface SampleTx {
  tx: string
  /** false 表示交易需要连接的钱包签名后才能提交。 */
  signed: boolean
  payout: string
}

const RUNNING_REFETCH_MS = 800
const IDLE_REFETCH_MS = 5_000

function isFinished(claim: Claim): boolean {
  return claim.events.some((event) => event.type === 'settled' || event.type === 'rejected' || event.type === 'failed')
}

/**
 * 事件的 `at` 按服务器时钟计算。客户端时钟慢于服务器时，按 `now - createdAt` 回放会把已到达的事件藏起来，
 * 所以把 createdAt 往前挪，保证已收到的事件都能显示。
 */
function alignToClientClock(claim: Claim): Claim {
  const lastAt = claim.events.reduce((max, event) => Math.max(max, event.at), 0)
  const createdAt = Math.min(Date.parse(claim.createdAt), Date.now() - lastAt)
  return { ...claim, createdAt: new Date(createdAt).toISOString() }
}

export function useClaimsQuery() {
  return useQuery({
    queryKey: claimKeys.all,
    queryFn: async () => (await http.get<Claim[]>('/claims')).data.map(alignToClientClock),
    refetchInterval: (query) =>
      query.state.data?.some((claim) => !isFinished(claim)) ? RUNNING_REFETCH_MS : IDLE_REFETCH_MS,
  })
}

export function useClaimQuery(id: string | undefined) {
  return useQuery({
    queryKey: claimKeys.detail(id ?? ''),
    queryFn: async () => alignToClientClock((await http.get<Claim>(`/claims/${id}`)).data),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data && isFinished(query.state.data) ? false : RUNNING_REFETCH_MS),
  })
}

export function useCreateClaimMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateClaimInput) => (await http.post<Claim>('/claims', input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimKeys.all })
      void queryClient.invalidateQueries({ queryKey: bountyKeys.all })
    },
  })
}

export function useSampleTxMutation() {
  return useMutation({
    mutationFn: async (input: { mode: SampleTxMode; signer?: string }) =>
      (await http.post<SampleTx>('/sample-tx', input)).data,
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bountyKeys } from '@/features/bounty'
import { base64ByteLength, sha256Hex } from '@/lib/bytes'
import { createMockClaim, mockClaims } from '@/mock/claims'
import { mockResponse } from '@/mock/mockResponse'
import type { CreateClaimInput } from '@/types/claim'

export const claimKeys = {
  all: ['claims'] as const,
  detail: (id: string) => ['claims', id] as const,
}

export function useClaimsQuery() {
  return useQuery({
    queryKey: claimKeys.all,
    queryFn: () => mockResponse(() => mockClaims),
  })
}

export function useClaimQuery(id: string | undefined) {
  return useQuery({
    queryKey: claimKeys.detail(id ?? ''),
    queryFn: () => mockResponse(() => mockClaims.find((claim) => claim.id === id) ?? null),
    enabled: Boolean(id),
  })
}

export function useCreateClaimMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateClaimInput) => {
      const meta = { txBytes: base64ByteLength(input.tx), txSha256: await sha256Hex(input.tx) }
      return mockResponse(() => createMockClaim(input, meta), 400)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimKeys.all })
      void queryClient.invalidateQueries({ queryKey: bountyKeys.all })
    },
  })
}

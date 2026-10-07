export type ClaimStage =
  | 'submitted'
  | 'simulating'
  | 'measured'
  | 'reported'
  | 'settled'

/** 验证事件；`at` 是相对提交时刻的毫秒数。 */
export type ClaimEvent =
  | { type: 'submitted'; at: number }
  | { type: 'simulating'; at: number }
  | { type: 'log'; at: number; line: string }
  | {
      type: 'measured'
      at: number
      preLamports: number
      postLamports: number
      thresholdLamports: number
      slot: number
    }
  | { type: 'reported'; at: number; reportHex: string }
  | {
      type: 'settled'
      at: number
      signature: string
      payoutDeltaLamports: number
      vaultBalanceLamports: number
      vaultPaused: boolean
    }
  | { type: 'rejected'; at: number }
  | { type: 'failed'; at: number; stage: ClaimStage; message: string }

/** 一次私密提交。攻击交易原文永远不会出现在这里，只有字节数和哈希。 */
export interface Claim {
  id: string
  bountyId: string
  bountyName: string
  vault: string
  payout: string
  txBytes: number
  txSha256: string
  createdAt: string
  events: ClaimEvent[]
}

export interface CreateClaimInput {
  bountyId: string
  payout: string
  tx: string
}

export type BountyStatus = 'active' | 'cancel_pending' | 'paid' | 'inactive'

export interface BountyLatestSubmission {
  claimId: string
  summary: string
}

/** 一个受保护的程序及其赏金（金库 PDA + 赏金 PDA 的链上状态）。 */
export interface Bounty {
  id: string
  name: string
  description: string
  vaultProgramId: string
  vault: string
  bountyProgramId: string
  bountyAccount: string
  guardian: string
  amountLamports: number
  thresholdLamports: number
  vaultBalanceLamports: number
  vaultPaused: boolean
  status: BountyStatus
  timelockDays: number
  submissionCount: number
  latestSubmission: BountyLatestSubmission | null
}

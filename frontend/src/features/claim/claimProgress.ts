import { formatSolCompact } from '@/lib/format'
import type { Claim, ClaimEvent, ClaimStage } from '@/types/claim'

export type ClaimOutcome = 'running' | 'paid' | 'rejected' | 'failed'
export type ClaimStageStatus = 'active' | 'done' | 'failed'

type EventOf<T extends ClaimEvent['type']> = Extract<ClaimEvent, { type: T }>

export interface ClaimProgress {
  outcome: ClaimOutcome
  stages: Array<{ stage: ClaimStage; status: ClaimStageStatus }>
  logs: string[]
  measured: EventOf<'measured'> | null
  reported: EventOf<'reported'> | null
  settled: EventOf<'settled'> | null
  failed: EventOf<'failed'> | null
}

export const claimStageOrder: ClaimStage[] = ['submitted', 'simulating', 'measured', 'reported', 'settled']

export const claimStageTitles: Record<ClaimStage, string> = {
  submitted: 'Received sealed submission',
  simulating: 'Simulating in CRE confidential workflow',
  measured: 'Invariant check',
  reported: 'DON-signed report',
  settled: 'Settled on Solana',
}

function findEvent<T extends ClaimEvent['type']>(events: ClaimEvent[], type: T): EventOf<T> | null {
  const event = events.find((item) => item.type === type)
  return event ? (event as EventOf<T>) : null
}

/** 按当前时刻回放验证事件，得到页面要展示的阶段和结果。 */
export function getClaimProgress(claim: Claim, now: number): ClaimProgress {
  const elapsed = now - Date.parse(claim.createdAt)
  const reached = claim.events.filter((event) => event.at <= elapsed)
  const settled = findEvent(reached, 'settled')
  const rejected = findEvent(reached, 'rejected')
  const failed = findEvent(reached, 'failed')
  const outcome: ClaimOutcome = settled ? 'paid' : rejected ? 'rejected' : failed ? 'failed' : 'running'

  const reachedStages = claimStageOrder.filter((stage) => reached.some((event) => event.type === stage))
  const stages = reachedStages.map((stage, index) => {
    const isLast = index === reachedStages.length - 1
    let status: ClaimStageStatus = outcome === 'running' && isLast ? 'active' : 'done'
    if (outcome === 'rejected' && stage === 'measured') status = 'failed'
    if (outcome === 'failed' && stage === failed?.stage) status = 'failed'
    return { stage, status }
  })

  return {
    outcome,
    stages,
    logs: reached.flatMap((event) => (event.type === 'log' ? [event.line] : [])),
    measured: findEvent(reached, 'measured'),
    reported: findEvent(reached, 'reported'),
    settled,
    failed,
  }
}

export function getClaimStatusLabel(progress: ClaimProgress): string {
  switch (progress.outcome) {
    case 'paid':
      return `Paid ${formatSolCompact(progress.settled?.payoutDeltaLamports ?? 0)}`
    case 'rejected':
      return 'Rejected'
    case 'failed':
      return 'Failed'
    default:
      return 'Verifying…'
  }
}

import { formatSolCompact } from '@/lib/format'
import type { Messages } from '@/lib/i18n'
import type { Claim, ClaimEvent, ClaimStage } from '@/types/claim'

export type ClaimOutcome = 'running' | 'paid' | 'rejected' | 'failed'
export type ClaimStageStatus = 'active' | 'done' | 'failed'
/** 验证卡片的三段式视图，对应课程编排卡片的 搜索中 → 编排中 → 已就绪。 */
export type ClaimPhase = 'verifying' | 'settling' | 'finished'

type EventOf<T extends ClaimEvent['type']> = Extract<ClaimEvent, { type: T }>

export interface ClaimProgress {
  outcome: ClaimOutcome
  phase: ClaimPhase
  stages: Array<{ stage: ClaimStage; status: ClaimStageStatus }>
  logs: string[]
  measured: EventOf<'measured'> | null
  reported: EventOf<'reported'> | null
  settled: EventOf<'settled'> | null
  failed: EventOf<'failed'> | null
}

export const claimStageOrder: ClaimStage[] = ['submitted', 'simulating', 'measured', 'reported', 'settled']

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
  const reported = findEvent(reached, 'reported')
  const phase: ClaimPhase = outcome !== 'running' ? 'finished' : reported ? 'settling' : 'verifying'

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
    phase,
    stages,
    logs: reached.flatMap((event) => (event.type === 'log' ? [event.line] : [])),
    measured: findEvent(reached, 'measured'),
    reported,
    settled,
    failed,
  }
}

/** 与 cre_bounty::on_report 的谓词一致：pre ≥ threshold 且 post < threshold。 */
export function isInvariantBroken(measured: EventOf<'measured'>): boolean {
  return measured.preLamports >= measured.thresholdLamports && measured.postLamports < measured.thresholdLamports
}

export function getClaimStatusLabel(progress: ClaimProgress, m: Messages): string {
  if (progress.outcome === 'paid') {
    return m.claim.status.paid(formatSolCompact(progress.settled?.payoutDeltaLamports ?? 0))
  }
  return m.claim.status[progress.outcome]
}

import { useEffect, useState } from 'react'
import type { Claim } from '@/types/claim'
import { getClaimProgress } from './claimProgress'

const TICK_INTERVAL_MS = 250

/** 当前时刻；只要还有提交在验证中就持续走表，全部结束后停表。 */
export function useClaimClock(claims: readonly Claim[]): number {
  const [now, setNow] = useState(() => Date.now())
  const hasRunningClaim = claims.some((claim) => getClaimProgress(claim, now).outcome === 'running')

  useEffect(() => {
    if (!hasRunningClaim) return undefined
    const timer = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [hasRunningClaim])

  return now
}

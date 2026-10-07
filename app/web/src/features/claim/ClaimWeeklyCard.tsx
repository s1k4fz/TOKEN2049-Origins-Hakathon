import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMessages } from '@/hooks/useMessages'
import { formatSolCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types/claim'
import { useClaimsQuery } from './claimApi'
import { getClaimProgress, getClaimStatusLabel } from './claimProgress'
import { useClaimClock } from './useClaimClock'

const NO_CLAIMS: Claim[] = []

/** 以周一为第 0 天的本地序号（Date.getDay() 里周日是 0）。 */
function mondayBasedIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** 目标周周一的本地 00:00。offsetWeeks 为 -1 即上周。 */
function startOfWeek(base: Date, offsetWeeks: number): Date {
  const date = new Date(base)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - mondayBasedIndex(date) + offsetWeeks * 7)
  return date
}

export function ClaimWeeklyCard({ className }: { className?: string }) {
  const m = useMessages()
  const navigate = useNavigate()
  const claimsQuery = useClaimsQuery()
  const claims = claimsQuery.data ?? NO_CLAIMS
  const now = useClaimClock(claims)
  // 0 = 本周，-1 = 上周。卡片只提供这两周。
  const [weekOffset, setWeekOffset] = useState(0)
  const isCurrentWeek = weekOffset === 0

  const today = new Date(now)
  const weekStart = startOfWeek(today, weekOffset).getTime()
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000
  const todayIndex = mondayBasedIndex(today)
  const weekClaims = claims.filter((claim) => {
    const createdAt = Date.parse(claim.createdAt)
    return createdAt >= weekStart && createdAt < weekEnd
  })

  const dayCounts = Array.from({ length: 7 }, () => 0)
  let paidLamports = 0
  for (const claim of weekClaims) {
    dayCounts[mondayBasedIndex(new Date(claim.createdAt))] += 1
    paidLamports += getClaimProgress(claim, now).settled?.payoutDeltaLamports ?? 0
  }

  const latestClaim = claims[0]

  return (
    <section
      aria-label={m.weekly.aria}
      className={cn(
        'flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white p-4 text-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
        className
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] leading-4 font-medium text-zinc-500">
            {isCurrentWeek ? m.weekly.thisWeek : m.weekly.lastWeek}
          </p>
          {claimsQuery.isPending ? (
            <Skeleton className="mt-1 h-6 w-32" />
          ) : (
            <h2 className="mt-1 text-[20px] leading-6 font-semibold tracking-[-0.02em]">
              {m.weekly.paid(formatSolCompact(paidLamports))}
            </h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!isCurrentWeek}
            onClick={() => setWeekOffset(-1)}
            className="size-7 rounded-full text-zinc-700 hover:bg-zinc-100 disabled:opacity-25"
            aria-label={m.weekly.showLastWeek}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isCurrentWeek}
            onClick={() => setWeekOffset(0)}
            className="size-7 rounded-full text-zinc-700 hover:bg-zinc-100 disabled:opacity-25"
            aria-label={m.weekly.showThisWeek}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <p className="mt-1.5 max-w-[250px] shrink-0 text-[12.5px] leading-[18px] text-zinc-400">
        {m.weekly.description}
      </p>

      <div className="mt-3.5 grid shrink-0 grid-cols-7 gap-1.5" aria-label={m.weekly.perDayAria}>
        {m.weekly.weekdays.map((label, index) => {
          const isFuture = isCurrentWeek && index > todayIndex
          const isToday = isCurrentWeek && index === todayIndex
          return (
            <div
              key={index}
              className={cn(
                'flex h-[48px] min-w-0 flex-col items-center justify-center rounded-[11px] bg-zinc-100/80 text-zinc-400',
                isToday && 'bg-zinc-200/90 text-zinc-800'
              )}
            >
              <span className="text-[11px] leading-4 font-medium">{label}</span>
              <span className="text-[14px] leading-4 font-medium">{isFuture ? '–' : dayCounts[index]}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-auto min-h-0 overflow-hidden pt-3.5">
        <p className="text-[14px] leading-5 font-medium text-zinc-500">{m.weekly.latest}</p>
        <div className="mt-2">
          {claimsQuery.isPending ? (
            <div className="rounded-[14px] border border-zinc-200 p-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-3/5" />
            </div>
          ) : latestClaim ? (
            <button
              type="button"
              onClick={() => navigate(`/claims/${latestClaim.id}`)}
              className="w-full rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:outline-none"
            >
              <span className="block truncate text-[14.5px] leading-5 font-semibold text-zinc-900">
                {latestClaim.bountyName}
              </span>
              <span className="mt-1.5 block truncate text-[13px] leading-[18px] text-zinc-400">
                {latestClaim.id} · {getClaimStatusLabel(getClaimProgress(latestClaim, now), m)}
              </span>
            </button>
          ) : (
            <div className="rounded-[14px] border border-zinc-200 px-3 py-4 text-[12.5px] text-zinc-400">
              {m.common.noSubmissions}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

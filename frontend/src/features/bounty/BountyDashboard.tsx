import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { NetworkStatus } from '@/components/NetworkStatus'
import { ProgressMarker } from '@/components/ProgressMarker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Bounty } from '@/types/bounty'
import { BountyDashboardSidebar, type BountySection } from './BountyDashboardSidebar'
import { BountyProtectionCard } from './BountyProtectionCard'
import { canSubmitTo, getProtectionConditions, getProtectionProgress } from './bountyStatus'

export function BountyDashboard({
  bounty,
  submissions,
}: {
  bounty: Bounty
  /** 提交列表由 claim feature 提供，页面负责拼进来。 */
  submissions: ReactNode
}) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<BountySection>('protection')
  const conditions = getProtectionConditions(bounty)
  const canSubmit = canSubmitTo(bounty)

  return (
    <div className="relative h-full overflow-y-auto rounded-md border border-zinc-200/80 bg-zinc-50">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <NetworkStatus />
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => navigate('/', { state: { bountyId: bounty.id } })}
          className="h-9 rounded-full bg-zinc-950 px-4 font-normal text-white hover:bg-zinc-800"
        >
          {canSubmit ? 'Submit a finding' : 'Bounty paid'}
        </Button>
      </div>

      <div className="flex min-h-full gap-12 px-10 pt-20 pb-16 xl:px-26">
        <div className="min-w-0 max-w-[670px] flex-1">
          {activeSection === 'protection' ? (
            <>
              <h2 className="text-2xl leading-8 font-medium text-zinc-900">Protection</h2>
              <p className="mt-3 text-[16px] leading-[26px] font-normal text-zinc-600">
                Every condition below is read live from Solana. If all of them hold, a transaction that breaks the
                invariant is paid automatically.
              </p>
              <div className="mt-8 flex flex-col">
                {conditions.map((condition, index) => {
                  const hasNext = index < conditions.length - 1
                  return (
                    <div key={condition.id} className={cn('relative flex gap-5', hasNext && 'pb-10')}>
                      {hasNext && (
                        <div className="absolute top-10 bottom-0 left-4 w-px -translate-x-1/2 bg-zinc-300" />
                      )}
                      <ProgressMarker label={String(index + 1)} progress={condition.verified ? 100 : 0} />
                      <BountyProtectionCard condition={condition} />
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl leading-8 font-medium text-zinc-900">Submissions</h2>
              <p className="mt-3 text-[16px] leading-[26px] font-normal text-zinc-600">
                Every verified report for this program. Exploit transactions are never shown here, only what left the
                enclave.
              </p>
              <div className="mt-6">{submissions}</div>
            </>
          )}
        </div>

        <BountyDashboardSidebar
          bounty={bounty}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sections={[
            { id: 'protection', label: 'Protection', markerLabel: '1', progress: getProtectionProgress(bounty) },
            {
              id: 'submissions',
              label: `Submissions (${bounty.submissionCount})`,
              markerLabel: '2',
              progress: bounty.status === 'paid' ? 100 : 0,
            },
          ]}
        />
      </div>
    </div>
  )
}

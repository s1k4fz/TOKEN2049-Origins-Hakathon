import { useParams } from 'react-router-dom'
import { PageNotice } from '@/components/PageNotice'
import { BountyDashboard, useBountyQuery } from '@/features/bounty'
import { ClaimSubmissionList } from '@/features/claim'
import { useMessages } from '@/hooks/useMessages'

export function BountyPage() {
  const m = useMessages()
  const { id } = useParams<{ id: string }>()
  const bountyQuery = useBountyQuery(id)

  if (bountyQuery.isPending) return <PageNotice message={m.notice.loadingProgram} />
  if (bountyQuery.isError) return <PageNotice message={m.notice.programLoadFailed} />
  if (!bountyQuery.data) return <PageNotice message={m.notice.programNotFound} />

  const bounty = bountyQuery.data
  return (
    <BountyDashboard
      key={bounty.id}
      bounty={bounty}
      submissions={<ClaimSubmissionList bountyId={bounty.id} />}
    />
  )
}

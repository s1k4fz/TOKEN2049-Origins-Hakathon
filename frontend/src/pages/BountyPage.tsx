import { useParams } from 'react-router-dom'
import { PageNotice } from '@/components/PageNotice'
import { BountyDashboard, useBountyQuery } from '@/features/bounty'
import { ClaimSubmissionList } from '@/features/claim'

export function BountyPage() {
  const { id } = useParams<{ id: string }>()
  const bountyQuery = useBountyQuery(id)

  if (bountyQuery.isPending) return <PageNotice message="Loading program…" />
  if (bountyQuery.isError) return <PageNotice message="Failed to load this program. Please refresh." />
  if (!bountyQuery.data) return <PageNotice message="Program not found" />

  const bounty = bountyQuery.data
  return (
    <BountyDashboard
      key={bounty.id}
      bounty={bounty}
      submissions={<ClaimSubmissionList bountyId={bounty.id} />}
    />
  )
}

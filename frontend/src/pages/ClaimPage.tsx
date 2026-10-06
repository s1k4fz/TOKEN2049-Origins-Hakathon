import { useParams } from 'react-router-dom'
import { PageNotice } from '@/components/PageNotice'
import { ClaimView, useClaimQuery } from '@/features/claim'

export function ClaimPage() {
  const { id } = useParams<{ id: string }>()
  const claimQuery = useClaimQuery(id)

  if (claimQuery.isPending) return <PageNotice message="Loading submission…" />
  if (claimQuery.isError) return <PageNotice message="Failed to load this submission. Please refresh." />
  if (!claimQuery.data) return <PageNotice message="Submission not found" />

  return <ClaimView key={claimQuery.data.id} claim={claimQuery.data} />
}

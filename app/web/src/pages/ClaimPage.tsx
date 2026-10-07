import { useParams } from 'react-router-dom'
import { PageNotice } from '@/components/PageNotice'
import { ClaimView, useClaimQuery } from '@/features/claim'
import { useMessages } from '@/hooks/useMessages'

export function ClaimPage() {
  const m = useMessages()
  const { id } = useParams<{ id: string }>()
  const claimQuery = useClaimQuery(id)

  if (claimQuery.isPending) return <PageNotice message={m.notice.loadingSubmission} />
  if (claimQuery.isError) return <PageNotice message={m.notice.submissionLoadFailed} />
  if (!claimQuery.data) return <PageNotice message={m.notice.submissionNotFound} />

  return <ClaimView key={claimQuery.data.id} claim={claimQuery.data} />
}

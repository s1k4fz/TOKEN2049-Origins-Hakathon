import { PageNotice } from '@/components/PageNotice'
import { useMessages } from '@/hooks/useMessages'

export function NotFoundPage() {
  const m = useMessages()
  return <PageNotice message={m.notice.pageNotFound} />
}

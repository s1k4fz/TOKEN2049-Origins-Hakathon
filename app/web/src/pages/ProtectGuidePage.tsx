import { ContentPageLayout } from '@/components/ContentPageLayout'
import { ProtectGuideContent } from '@/features/protect'
import { useMessages } from '@/hooks/useMessages'

export function ProtectGuidePage() {
  const m = useMessages()

  return (
    <div className="h-full overflow-hidden rounded-md border border-zinc-200/80">
      <ContentPageLayout title={m.protect.title} nextHref="/bounties/vault" nextLabel={m.protect.next}>
        <ProtectGuideContent />
      </ContentPageLayout>
    </div>
  )
}

import { ContentPageLayout } from '@/components/ContentPageLayout'
import { ProtectGuideContent } from '@/features/protect'

export function ProtectGuidePage() {
  return (
    <div className="h-full overflow-hidden rounded-md border border-zinc-200/80">
      <ContentPageLayout title="Protect your program" nextHref="/bounties/vault" nextLabel="See a protected program">
        <ProtectGuideContent />
      </ContentPageLayout>
    </div>
  )
}

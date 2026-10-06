import { useLocation } from 'react-router-dom'
import { NetworkStatus } from '@/components/NetworkStatus'
import { SubmitComposer } from '@/features/claim'

function readBountyId(state: unknown): string | undefined {
  if (typeof state === 'object' && state !== null && 'bountyId' in state) {
    const { bountyId } = state as { bountyId: unknown }
    return typeof bountyId === 'string' ? bountyId : undefined
  }
  return undefined
}

export function SubmitPage() {
  const location = useLocation()

  return (
    <div className="relative h-full overflow-y-auto rounded-md border border-zinc-200/80 bg-zinc-50">
      <div className="absolute top-4 right-4">
        <NetworkStatus />
      </div>
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Found a bug? Prove it privately.</h1>
            <p className="text-sm text-zinc-500">
              Your exploit is only simulated inside a Chainlink CRE confidential workflow. It is never broadcast or
              published.
            </p>
          </div>
          <SubmitComposer key={location.key} initialBountyId={readBountyId(location.state)} />
        </div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capsule } from '@/components/Capsule'
import { ProgressStatusIcon } from '@/components/ProgressStatusIcon'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { explorerTxUrl } from '@/lib/explorer'
import { formatSol, formatSolCompact, shortAddress, shortHash } from '@/lib/format'
import type { Claim, ClaimStage } from '@/types/claim'
import { ClaimStageBlock } from './ClaimStageBlock'
import { claimStageTitles, type ClaimProgress } from './claimProgress'

const actionButtonClassName = 'h-[33px] rounded-full px-[12.5px] text-[14px] font-normal'
const secondaryActionButtonClassName = `${actionButtonClassName} border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950`
const primaryActionButtonClassName = `${actionButtonClassName} bg-zinc-950 text-white hover:bg-zinc-800`

function CardHeader({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const { outcome, measured, settled, failed } = progress
  const title =
    outcome === 'paid'
      ? `Bounty paid: ${formatSolCompact(settled?.payoutDeltaLamports ?? 0)}`
      : outcome === 'rejected'
        ? 'No payout: invariant held'
        : outcome === 'failed'
          ? 'Verification failed'
          : 'Verifying inside the enclave'
  const description =
    outcome === 'paid'
      ? `The vault was paused in the same transaction. No funds were ever at risk.`
      : outcome === 'rejected' && measured
        ? `After simulation the vault still holds ${formatSol(measured.postLamports)}, which is above the ${formatSolCompact(measured.thresholdLamports)} threshold. Nothing was published.`
        : outcome === 'failed'
          ? (failed?.message ?? 'Something went wrong.')
          : `Your exploit for ${claim.bountyName} stays inside the enclave. Only the measured balances and your payout address come out.`

  return (
    <div>
      <h3 className="flex items-center gap-2 text-[19.5px] leading-7 font-semibold tracking-tight text-zinc-900">
        <span className="flex size-5 shrink-0 translate-y-[1px] items-center justify-center [&_svg]:size-5">
          {outcome === 'running' ? (
            <Spinner aria-label="Verifying" className="size-[17px] text-zinc-900" />
          ) : (
            <ProgressStatusIcon status={outcome === 'paid' ? 'completed' : 'failed'} />
          )}
        </span>
        <span>{title}</span>
      </h3>
      <p className="mt-1.5 text-[14px] leading-[22px] text-zinc-500">{description}</p>
    </div>
  )
}

function StageContent({ stage, claim, progress }: { stage: ClaimStage; claim: Claim; progress: ClaimProgress }) {
  const { measured, reported, settled } = progress

  if (stage === 'submitted') {
    return (
      <>
        <Capsule mono>{claim.txBytes} bytes</Capsule>
        <Capsule mono>sha256 {shortHash(claim.txSha256)}</Capsule>
        <Capsule mono>payout {shortAddress(claim.payout)}</Capsule>
      </>
    )
  }

  if (stage === 'simulating') {
    return progress.logs.map((line) => (
      <p key={line} className="font-mono text-[12px] leading-5 whitespace-pre-wrap text-zinc-500">
        {line}
      </p>
    ))
  }

  if (stage === 'measured' && measured) {
    const broken = measured.preLamports >= measured.thresholdLamports && measured.postLamports < measured.thresholdLamports
    return (
      <>
        <Capsule mono>Before {formatSol(measured.preLamports)}</Capsule>
        <Capsule mono>After {formatSol(measured.postLamports)}</Capsule>
        <Capsule mono>Threshold {formatSolCompact(measured.thresholdLamports)}</Capsule>
        <Capsule tone={broken ? 'success' : 'danger'}>{broken ? 'Invariant broken' : 'Invariant held'}</Capsule>
      </>
    )
  }

  if (stage === 'reported' && reported && measured) {
    return (
      <>
        <Capsule mono>pre {formatSol(measured.preLamports)}</Capsule>
        <Capsule mono>post {formatSol(measured.postLamports)}</Capsule>
        <Capsule mono>slot {measured.slot.toLocaleString('en-US')}</Capsule>
        <Capsule mono>threshold {formatSolCompact(measured.thresholdLamports)}</Capsule>
        <Capsule mono>payout {shortAddress(claim.payout)}</Capsule>
        <Capsule mono>vault {shortAddress(claim.vault)}</Capsule>
        <p className="w-full text-[12.5px] text-zinc-400">
          This is everything that leaves the enclave · {reported.reportHex.length / 2} bytes
        </p>
      </>
    )
  }

  if (stage === 'settled' && settled) {
    return (
      <>
        <Capsule mono href={explorerTxUrl(settled.signature)}>
          tx {shortHash(settled.signature)}
          <ExternalLink className="size-3" />
        </Capsule>
        <Capsule>{settled.vaultPaused ? 'Vault paused' : 'Vault live'}</Capsule>
        <Capsule mono>
          +{formatSolCompact(settled.payoutDeltaLamports)} → {shortAddress(claim.payout)}
        </Capsule>
      </>
    )
  }

  return null
}

export function ClaimVerificationCard({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const navigate = useNavigate()
  const { outcome, settled, failed } = progress
  const backToBounty = () => navigate(`/bounties/${claim.bountyId}`)

  let actions: ReactNode = null
  if (outcome === 'paid' && settled) {
    actions = (
      <>
        <Button type="button" variant="outline" className={secondaryActionButtonClassName} onClick={backToBounty}>
          Back to bounty
        </Button>
        <Button asChild className={primaryActionButtonClassName}>
          <a href={explorerTxUrl(settled.signature)} target="_blank" rel="noreferrer">
            View transaction
          </a>
        </Button>
      </>
    )
  } else if (outcome === 'rejected' || outcome === 'failed') {
    actions = (
      <>
        <Button type="button" variant="outline" className={secondaryActionButtonClassName} onClick={backToBounty}>
          Back to bounty
        </Button>
        <Button
          type="button"
          className={primaryActionButtonClassName}
          onClick={() => navigate('/', { state: { bountyId: claim.bountyId } })}
        >
          Try again
        </Button>
      </>
    )
  }

  return (
    <div
      data-slot="claim-verification-card"
      className="flex w-full max-w-[40rem] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-transparent px-5 py-5"
    >
      <CardHeader claim={claim} progress={progress} />

      <div className="mt-4 flex flex-col">
        {progress.stages.map(({ stage, status }) => (
          <ClaimStageBlock
            key={stage}
            status={status}
            title={claimStageTitles[stage]}
            contentClassName={
              stage === 'simulating' ? 'flex min-h-7 flex-col gap-0.5 pt-1 pb-2.5' : undefined
            }
          >
            <StageContent stage={stage} claim={claim} progress={progress} />
            {status === 'failed' && failed?.stage === stage ? (
              <p className="w-full text-[13px] text-destructive">{failed.message}</p>
            ) : null}
          </ClaimStageBlock>
        ))}
      </div>

      {actions ? <div className="-mx-1 -mb-1 mt-auto flex justify-end gap-2 pt-4">{actions}</div> : null}
    </div>
  )
}

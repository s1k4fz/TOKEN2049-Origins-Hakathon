import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capsule } from '@/components/Capsule'
import { ProgressStatusIcon } from '@/components/ProgressStatusIcon'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { explorerTxUrl } from '@/lib/explorer'
import { formatSol, formatSolCompact, shortAddress, shortHash } from '@/lib/format'
import type { Claim, ClaimStage } from '@/types/claim'
import { ClaimOutlineTree, type OutlineModule, type OutlineStatus } from './ClaimOutlineTree'
import { ClaimStageBlock } from './ClaimStageBlock'
import { claimStageTitles, isInvariantBroken, type ClaimProgress } from './claimProgress'

const actionButtonClassName = 'h-[33px] rounded-full px-[12.5px] text-[14px] font-normal'
const secondaryActionButtonClassName = `${actionButtonClassName} border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950`
const primaryActionButtonClassName = `${actionButtonClassName} bg-zinc-950 text-white hover:bg-zinc-800`

// 验证中只展示到不变量判定为止；报告和上链属于结算树。
const VERIFYING_STAGES: ClaimStage[] = ['submitted', 'simulating', 'measured']

function CardHeader({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const { outcome, phase, measured, settled, failed } = progress
  const title =
    outcome === 'paid'
      ? `Bounty paid: ${formatSolCompact(settled?.payoutDeltaLamports ?? 0)}`
      : outcome === 'rejected'
        ? 'No payout: invariant held'
        : outcome === 'failed'
          ? 'Verification failed'
          : phase === 'settling'
            ? 'Settling on Solana'
            : 'Verifying inside the enclave'
  const description =
    outcome === 'paid'
      ? 'The vault was paused in the same transaction. No funds were ever at risk.'
      : outcome === 'rejected' && measured
        ? `After simulation the vault still holds ${formatSol(measured.postLamports)}, which is above the ${formatSolCompact(measured.thresholdLamports)} threshold. Nothing was published.`
        : outcome === 'failed'
          ? (failed?.message ?? 'Something went wrong.')
          : phase === 'settling'
            ? 'The signed report is checked on-chain. Pausing the vault and paying the bounty happen in one transaction.'
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
  const { measured } = progress

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
    return (
      <>
        <Capsule>Confidential handler</Capsule>
        <Capsule>sigVerify on</Capsule>
        <Capsule>Never broadcast</Capsule>
      </>
    )
  }

  if (stage === 'measured' && measured) {
    const broken = isInvariantBroken(measured)
    return (
      <>
        <Capsule mono>Before {formatSol(measured.preLamports)}</Capsule>
        <Capsule mono>After {formatSol(measured.postLamports)}</Capsule>
        <Capsule mono>Threshold {formatSolCompact(measured.thresholdLamports)}</Capsule>
        <Capsule tone={broken ? 'success' : 'danger'}>{broken ? 'Invariant broken' : 'Invariant held'}</Capsule>
      </>
    )
  }

  return null
}

function VerifyingStages({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const { failed } = progress
  return (
    <div className="mt-4 flex flex-col">
      {progress.stages
        .filter(({ stage }) => VERIFYING_STAGES.includes(stage))
        .map(({ stage, status }) => (
          <ClaimStageBlock key={stage} status={status} title={claimStageTitles[stage]}>
            <StageContent stage={stage} claim={claim} progress={progress} />
            {status === 'failed' && failed?.stage === stage ? (
              <p className="w-full text-[13px] text-destructive">{failed.message}</p>
            ) : null}
          </ClaimStageBlock>
        ))}
    </div>
  )
}

function getOutlineModules(claim: Claim, progress: ClaimProgress): OutlineModule[] {
  const { outcome, measured, reported, settled, failed } = progress
  if (!measured) return []

  const broken = isInvariantBroken(measured)
  const modules: OutlineModule[] = [
    {
      id: 'invariant',
      title: `${broken ? 'Invariant broken' : 'Invariant held'} · vault ≥ ${formatSolCompact(measured.thresholdLamports)}`,
      status: broken ? 'done' : 'failed',
      rows: [
        { id: 'pre', label: 'Vault before simulation', meta: formatSol(measured.preLamports), status: 'done' },
        { id: 'post', label: 'Vault after simulation', meta: formatSol(measured.postLamports), status: 'done' },
      ],
    },
  ]

  if (!reported) {
    if (outcome === 'rejected') {
      modules.push({
        id: 'report',
        title: 'No report produced',
        status: 'failed',
        rows: [{ id: 'exploit', label: 'Exploit transaction', meta: 'never published', status: 'done' }],
      })
    }
    return modules
  }

  modules.push({
    id: 'report',
    title: `DON-signed report · ${reported.reportHex.length / 2} bytes`,
    status: 'done',
    rows: [
      { id: 'exploit', label: 'Exploit transaction', meta: 'not included', status: 'done' },
      { id: 'payout', label: 'Payout address', meta: shortAddress(claim.payout), status: 'done' },
      { id: 'slot', label: 'Simulated at slot', meta: measured.slot.toLocaleString('en-US'), status: 'done' },
    ],
  })

  const txFailed = outcome === 'failed' && failed?.stage === 'settled'
  const txStatus: OutlineStatus = settled ? 'done' : txFailed ? 'failed' : 'active'
  modules.push({
    id: 'transaction',
    title: 'on_report transaction',
    status: txStatus,
    rows: [
      {
        id: 'pause',
        label: 'Pause the vault through its guardian hook',
        meta: settled ? (settled.vaultPaused ? 'paused' : 'live') : undefined,
        status: txStatus,
      },
      {
        id: 'pay',
        label: `Pay the bounty to ${shortAddress(claim.payout)}`,
        meta: settled ? `+${formatSolCompact(settled.payoutDeltaLamports)}` : undefined,
        status: settled ? 'done' : txFailed ? 'failed' : 'pending',
      },
    ],
  })
  return modules
}

export function ClaimVerificationCard({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const navigate = useNavigate()
  const { outcome, phase, measured, settled } = progress
  const backToBounty = () => navigate(`/bounties/${claim.bountyId}`)
  // 测出余额之后才有可结算的内容；更早失败的提交留在验证中视图里显示出错的阶段。
  const showOutline = phase !== 'verifying' && measured !== null

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

      {showOutline ? (
        <div key="outline" data-stage={phase}>
          <ClaimOutlineTree modules={getOutlineModules(claim, progress)} />
        </div>
      ) : (
        <div key="verifying" data-stage="verifying">
          <VerifyingStages claim={claim} progress={progress} />
        </div>
      )}

      {actions ? <div className="-mx-1 -mb-1 mt-auto flex justify-end gap-2 pt-4">{actions}</div> : null}
    </div>
  )
}

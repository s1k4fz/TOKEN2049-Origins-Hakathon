import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capsule } from '@/components/Capsule'
import { ProgressStatusIcon } from '@/components/ProgressStatusIcon'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useMessages } from '@/hooks/useMessages'
import { explorerTxUrl } from '@/lib/explorer'
import { formatSol, formatSolCompact, shortAddress, shortHash } from '@/lib/format'
import type { Messages } from '@/lib/i18n'
import type { Claim, ClaimStage } from '@/types/claim'
import { ClaimOutlineTree, type OutlineModule, type OutlineStatus } from './ClaimOutlineTree'
import { ClaimStageBlock } from './ClaimStageBlock'
import { isInvariantBroken, type ClaimProgress } from './claimProgress'

const actionButtonClassName = 'h-[33px] rounded-full px-[12.5px] text-[14px] font-normal'
const secondaryActionButtonClassName = `${actionButtonClassName} border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950`
const primaryActionButtonClassName = `${actionButtonClassName} bg-zinc-950 text-white hover:bg-zinc-800`

// 验证中只展示到不变量判定为止；报告和上链属于结算树。
const VERIFYING_STAGES: ClaimStage[] = ['submitted', 'simulating', 'measured']

function CardHeader({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const m = useMessages()
  const { header, description: copy } = m.claim
  const { outcome, phase, measured, settled, failed } = progress
  const title =
    outcome === 'paid'
      ? header.paid(formatSolCompact(settled?.payoutDeltaLamports ?? 0))
      : outcome === 'rejected'
        ? header.rejected
        : outcome === 'failed'
          ? header.failed
          : phase === 'settling'
            ? header.settling
            : header.verifying
  const description =
    outcome === 'paid'
      ? copy.paid
      : outcome === 'rejected' && measured
        ? copy.rejected(formatSol(measured.postLamports), formatSolCompact(measured.thresholdLamports))
        : outcome === 'failed'
          ? (failed?.message ?? copy.failedFallback)
          : phase === 'settling'
            ? copy.settling
            : copy.verifying(claim.bountyName)

  return (
    <div>
      <h3 className="flex items-center gap-2 text-[19.5px] leading-7 font-semibold tracking-tight text-zinc-900">
        <span className="flex size-5 shrink-0 translate-y-[1px] items-center justify-center [&_svg]:size-5">
          {outcome === 'running' ? (
            <Spinner aria-label={header.verifyingAria} className="size-[17px] text-zinc-900" />
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
  const m = useMessages()
  const { capsules } = m.claim
  const { measured } = progress

  if (stage === 'submitted') {
    return (
      <>
        <Capsule mono>{m.submit.bytes(claim.txBytes)}</Capsule>
        <Capsule mono>sha256 {shortHash(claim.txSha256)}</Capsule>
        <Capsule mono>{capsules.payout(shortAddress(claim.payout))}</Capsule>
      </>
    )
  }

  if (stage === 'simulating') {
    return (
      <>
        <Capsule>{capsules.confidentialHandler}</Capsule>
        <Capsule>{capsules.sigVerifyOn}</Capsule>
        <Capsule>{capsules.neverBroadcast}</Capsule>
      </>
    )
  }

  if (stage === 'measured' && measured) {
    const broken = isInvariantBroken(measured)
    return (
      <>
        <Capsule mono>{capsules.before(formatSol(measured.preLamports))}</Capsule>
        <Capsule mono>{capsules.after(formatSol(measured.postLamports))}</Capsule>
        <Capsule mono>{capsules.threshold(formatSolCompact(measured.thresholdLamports))}</Capsule>
        <Capsule tone={broken ? 'success' : 'danger'}>{broken ? capsules.broken : capsules.held}</Capsule>
      </>
    )
  }

  return null
}

function VerifyingStages({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const m = useMessages()
  const { failed } = progress
  return (
    <div className="mt-4 flex flex-col">
      {progress.stages
        .filter(({ stage }) => VERIFYING_STAGES.includes(stage))
        .map(({ stage, status }) => (
          <ClaimStageBlock key={stage} status={status} title={m.claim.stages[stage]}>
            <StageContent stage={stage} claim={claim} progress={progress} />
            {status === 'failed' && failed?.stage === stage ? (
              <p className="w-full text-[13px] text-destructive">{failed.message}</p>
            ) : null}
          </ClaimStageBlock>
        ))}
    </div>
  )
}

function getOutlineModules(claim: Claim, progress: ClaimProgress, m: Messages): OutlineModule[] {
  const text = m.claim.outline
  const { outcome, measured, reported, settled, failed } = progress
  if (!measured) return []

  const broken = isInvariantBroken(measured)
  const modules: OutlineModule[] = [
    {
      id: 'invariant',
      title: text.invariant(broken, formatSolCompact(measured.thresholdLamports)),
      status: broken ? 'done' : 'failed',
      rows: [
        { id: 'pre', label: text.vaultBefore, meta: formatSol(measured.preLamports), status: 'done' },
        { id: 'post', label: text.vaultAfter, meta: formatSol(measured.postLamports), status: 'done' },
      ],
    },
  ]

  if (!reported) {
    if (outcome === 'rejected') {
      modules.push({
        id: 'report',
        title: text.noReport,
        status: 'failed',
        rows: [{ id: 'exploit', label: text.exploitTx, meta: text.neverPublished, status: 'done' }],
      })
    }
    return modules
  }

  modules.push({
    id: 'report',
    title: text.report(reported.reportHex.length / 2),
    status: 'done',
    rows: [
      { id: 'exploit', label: text.exploitTx, meta: text.notIncluded, status: 'done' },
      { id: 'payout', label: text.payoutAddress, meta: shortAddress(claim.payout), status: 'done' },
      { id: 'slot', label: text.simulatedAtSlot, meta: measured.slot.toLocaleString('en-US'), status: 'done' },
    ],
  })

  const txFailed = outcome === 'failed' && failed?.stage === 'settled'
  const txStatus: OutlineStatus = settled ? 'done' : txFailed ? 'failed' : 'active'
  modules.push({
    id: 'transaction',
    title: text.transaction,
    status: txStatus,
    rows: [
      {
        id: 'pause',
        label: text.pauseVault,
        meta: settled ? (settled.vaultPaused ? text.paused : text.live) : undefined,
        status: txStatus,
      },
      {
        id: 'pay',
        label: text.payBounty(shortAddress(claim.payout)),
        meta: settled ? `+${formatSolCompact(settled.payoutDeltaLamports)}` : undefined,
        status: settled ? 'done' : txFailed ? 'failed' : 'pending',
      },
    ],
  })
  return modules
}

export function ClaimVerificationCard({ claim, progress }: { claim: Claim; progress: ClaimProgress }) {
  const m = useMessages()
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
          {m.common.backToBounty}
        </Button>
        <Button asChild className={primaryActionButtonClassName}>
          <a href={explorerTxUrl(settled.signature)} target="_blank" rel="noreferrer">
            {m.common.viewTransaction}
          </a>
        </Button>
      </>
    )
  } else if (outcome === 'rejected' || outcome === 'failed') {
    actions = (
      <>
        <Button type="button" variant="outline" className={secondaryActionButtonClassName} onClick={backToBounty}>
          {m.common.backToBounty}
        </Button>
        <Button
          type="button"
          className={primaryActionButtonClassName}
          onClick={() => navigate('/', { state: { bountyId: claim.bountyId } })}
        >
          {m.common.tryAgain}
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
          <ClaimOutlineTree modules={getOutlineModules(claim, progress, m)} />
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

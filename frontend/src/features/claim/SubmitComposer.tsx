import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  ArrowUp,
  Check,
  ChevronDown,
  FlaskConical,
  Lock,
  Scale,
  Shield,
  Terminal,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ActionChip } from '@/components/ActionChip'
import { ActionMenu, ActionMenuItem } from '@/components/ActionMenu'
import { Button } from '@/components/ui/button'
import { canSubmitTo, useBountiesQuery } from '@/features/bounty'
import { base64ByteLength, sha256Hex } from '@/lib/bytes'
import { formatSolCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  BUILD_TX_COMMAND,
  SAMPLE_EXPLOIT_TX,
  SAMPLE_HONEST_TX,
  SAMPLE_PAYOUT,
} from '@/mock/sampleTransactions'
import { useCreateClaimMutation } from './claimApi'
import { SealedExploitChip } from './SealedExploitChip'
import {
  getPayoutError,
  getTransactionError,
  isSealableTransaction,
  normalizeTransaction,
} from './submissionValidation'

// 输入框下方的托底条：负间距压进输入框底部圆角，和 Lemma 首页输入框一致。
const COMPOSER_CHIN_CLASS_NAME =
  'relative z-0 -mt-[22px] flex h-[62px] items-center gap-1.5 rounded-b-[22px] bg-zinc-100 px-3.5 pt-[22px]'

const chinButtonClassName =
  'h-7 gap-1.5 -translate-y-[1px] rounded-full bg-transparent px-2.5 text-[14px] font-normal leading-5 text-zinc-700 hover:bg-black/[0.05] hover:text-zinc-950 data-[state=open]:bg-black/[0.08] data-[state=open]:text-zinc-950 has-[>svg]:px-2.5'

interface SealedTransaction {
  tx: string
  bytes: number
  sha256: string | null
}

export function SubmitComposer({ initialBountyId }: { initialBountyId?: string }) {
  const navigate = useNavigate()
  const bountiesQuery = useBountiesQuery()
  const createClaim = useCreateClaimMutation()
  const [draft, setDraft] = useState('')
  const [sealed, setSealed] = useState<SealedTransaction | null>(null)
  const [payout, setPayout] = useState('')
  const [selectedBountyId, setSelectedBountyId] = useState(initialBountyId)
  const [commandCopied, setCommandCopied] = useState(false)

  const bounties = bountiesQuery.data ?? []
  const target = bounties.find((bounty) => bounty.id === selectedBountyId) ?? bounties[0]
  const payoutError = target ? getPayoutError(payout, [target.vault, target.bountyAccount]) : null
  const draftError = getTransactionError(draft)
  const targetClosed = target ? !canSubmitTo(target) : false
  const canSend =
    Boolean(sealed && target && payout.trim()) && !payoutError && !targetClosed && !createClaim.isPending

  const seal = (tx: string) => {
    setSealed({ tx, bytes: base64ByteLength(tx), sha256: null })
    setDraft('')
    void sha256Hex(tx).then((sha256) => {
      setSealed((current) => (current?.tx === tx ? { ...current, sha256 } : current))
    })
  }

  const fillSample = (tx: string) => {
    seal(tx)
    if (!payout.trim()) setPayout(SAMPLE_PAYOUT)
  }

  const copyBuildCommand = async () => {
    await navigator.clipboard.writeText(BUILD_TX_COMMAND)
    setCommandCopied(true)
    setTimeout(() => setCommandCopied(false), 1500)
  }

  const handleDraftChange = (value: string) => {
    const tx = normalizeTransaction(value)
    if (isSealableTransaction(tx)) {
      seal(tx)
      return
    }
    setDraft(value)
  }

  const submit = () => {
    if (!canSend || !sealed || !target) return
    createClaim.mutate(
      { bountyId: target.id, payout: payout.trim(), tx: sealed.tx },
      { onSuccess: (claim) => navigate(`/claims/${claim.id}`) }
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const errorMessage = targetClosed
    ? 'This bounty has been paid and the vault is paused.'
    : (draftError ?? payoutError ?? (createClaim.isError ? 'Submission failed. Please try again.' : null))

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative z-10 flex flex-col rounded-[22px] border border-zinc-200 bg-white">
          {sealed ? (
            <div className="flex min-h-[68px] items-start px-4 pt-4 pb-2">
              <SealedExploitChip bytes={sealed.bytes} sha256={sealed.sha256} onClear={() => setSealed(null)} />
            </div>
          ) : (
            <textarea
              placeholder="Paste your signed exploit transaction (base64)…"
              rows={1}
              value={draft}
              spellCheck={false}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={handleKeyDown}
              className="scrollbar-hidden max-h-[calc(6*1.625em+1.5rem)] min-h-[68px] w-full resize-none overflow-y-auto border-0 bg-transparent px-4 pt-4 pb-2 font-mono text-[14px] leading-relaxed break-all text-zinc-900 outline-none placeholder:font-sans placeholder:text-[15px] placeholder:text-zinc-400"
              style={{ fieldSizing: 'content' } as CSSProperties}
            />
          )}

          <div className="flex items-center gap-2 px-4 pt-1 pb-4">
            <span className="flex items-center gap-1.5 text-[12.5px] text-zinc-400">
              <Lock className="size-3.5" />
              Never broadcast · simulated only inside the enclave
            </span>
            <div className="mr-[-4px] mb-[-4px] ml-auto">
              <Button
                type="button"
                variant="default"
                size="icon"
                disabled={!canSend}
                onClick={submit}
                className={cn(
                  'rounded-full transition-colors',
                  canSend ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'cursor-default bg-zinc-200 text-zinc-400'
                )}
                aria-label="Submit privately"
              >
                <ArrowUp className="size-[18px]" />
              </Button>
            </div>
          </div>
        </div>

        <div className={COMPOSER_CHIN_CLASS_NAME}>
          <ActionMenu
            align="start"
            width="lg"
            trigger={
              <Button type="button" variant="ghost" className={chinButtonClassName}>
                <Shield className="size-[16.5px]" />
                <span>{target ? target.name : 'Loading programs…'}</span>
                <ChevronDown className="size-3.5 text-zinc-400" />
              </Button>
            }
          >
            {bounties.map((bounty) => (
              <ActionMenuItem
                key={bounty.id}
                icon={Shield}
                label={`${bounty.name} · ${formatSolCompact(bounty.amountLamports)}`}
                disabled={!canSubmitTo(bounty)}
                onSelect={() => setSelectedBountyId(bounty.id)}
              />
            ))}
          </ActionMenu>

          <span className="h-4 w-px bg-zinc-300" />

          <label className="flex min-w-0 flex-1 -translate-y-[1px] items-center gap-1.5 rounded-full px-2.5 text-zinc-700">
            <Wallet className="size-[16.5px] shrink-0" />
            <input
              type="text"
              value={payout}
              spellCheck={false}
              autoComplete="off"
              aria-label="Payout address"
              placeholder="Payout address (base58)"
              onChange={(event) => setPayout(event.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-zinc-900 outline-none placeholder:font-sans placeholder:text-[14px] placeholder:text-zinc-400"
            />
          </label>
        </div>
      </div>

      <p className={cn('min-h-5 px-4 text-[13px] text-destructive', !errorMessage && 'invisible')}>
        {errorMessage ?? 'placeholder'}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <ActionChip
          icon={FlaskConical}
          iconColor="#2F6F5E"
          label="Use sample exploit"
          onClick={() => fillSample(SAMPLE_EXPLOIT_TX)}
        />
        <ActionChip
          icon={Scale}
          iconColor="#62558A"
          label="Use non-exploit transaction"
          onClick={() => fillSample(SAMPLE_HONEST_TX)}
        />
        <ActionChip
          icon={commandCopied ? Check : Terminal}
          iconColor="#0047BB"
          label={commandCopied ? 'Copied' : 'Copy CLI to build a tx'}
          onClick={() => void copyBuildCommand()}
        />
      </div>

      <p className="pt-2 text-center text-[12.5px] text-zinc-400">
        Signed transactions expire about 60 seconds after creation. Generate it right before you submit.
      </p>
    </div>
  )
}

import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowUp, ChevronDown, FlaskConical, PenLine, Scale, Shield, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ActionChip } from '@/components/ActionChip'
import { ActionMenu, ActionMenuItem } from '@/components/ActionMenu'
import { Button } from '@/components/ui/button'
import { canSubmitTo, useBountiesQuery } from '@/features/bounty'
import { useSolanaWallet } from '@/features/wallet'
import { useMessages } from '@/hooks/useMessages'
import { base64ByteLength, sha256OfBase64 } from '@/lib/bytes'
import { formatSolCompact } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useCreateClaimMutation, useSampleTxMutation, type SampleTxMode } from './claimApi'
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
  const m = useMessages()
  const navigate = useNavigate()
  const bountiesQuery = useBountiesQuery()
  const createClaim = useCreateClaimMutation()
  const sampleTx = useSampleTxMutation()
  const wallet = useSolanaWallet()
  const [draft, setDraft] = useState('')
  const [sealed, setSealed] = useState<SealedTransaction | null>(null)
  const [payout, setPayout] = useState('')
  const [selectedBountyId, setSelectedBountyId] = useState(initialBountyId)
  const [preparing, setPreparing] = useState<'building' | 'signing' | null>(null)
  const [prepareError, setPrepareError] = useState<string | null>(null)

  useEffect(() => {
    if (wallet.address) setPayout((current) => (current.trim() ? current : (wallet.address ?? '')))
  }, [wallet.address])

  const bounties = bountiesQuery.data ?? []
  const target = bounties.find((bounty) => bounty.id === selectedBountyId) ?? bounties[0]
  const payoutError = target ? getPayoutError(payout, [target.vault, target.bountyAccount], m) : null
  const draftError = getTransactionError(draft, m)
  const targetClosed = target ? !canSubmitTo(target) : false
  const canSend =
    Boolean(sealed && target && payout.trim()) &&
    !payoutError &&
    !targetClosed &&
    !createClaim.isPending &&
    preparing === null

  const seal = (tx: string) => {
    setSealed({ tx, bytes: base64ByteLength(tx), sha256: null })
    setDraft('')
    void sha256OfBase64(tx).then((sha256) => {
      setSealed((current) => (current?.tx === tx ? { ...current, sha256 } : current))
    })
  }

  /** 交易在 Devnet 上现场生成；签名后约 60 秒过期，所以不能预先写死。 */
  const fillSample = async (mode: SampleTxMode) => {
    setPrepareError(null)
    setPreparing('building')
    try {
      const sample = await sampleTx.mutateAsync({ mode })
      seal(sample.tx)
      if (!payout.trim()) setPayout(sample.payout)
    } catch (error) {
      setPrepareError(getApiErrorMessage(error) ?? m.submit.sampleFailed)
    } finally {
      setPreparing(null)
    }
  }

  const signWithWallet = async () => {
    if (!wallet.address) {
      void wallet.connect()
      return
    }
    setPrepareError(null)
    setPreparing('building')
    try {
      const sample = await sampleTx.mutateAsync({ mode: 'exploit', signer: wallet.address })
      setPreparing('signing')
      const signed = await wallet.signTransaction(sample.tx).catch(() => {
        throw new Error(m.submit.walletSignFailed)
      })
      seal(signed)
      setPayout(wallet.address)
    } catch (error) {
      setPrepareError(getApiErrorMessage(error) ?? m.submit.sampleFailed)
    } finally {
      setPreparing(null)
    }
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
    ? m.submit.targetClosed
    : (draftError ??
      payoutError ??
      prepareError ??
      (createClaim.isError ? (getApiErrorMessage(createClaim.error) ?? m.submit.submitFailed) : null))
  const statusMessage =
    preparing === 'building' ? m.submit.preparingTx : preparing === 'signing' ? m.submit.walletSigning : null

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
              placeholder={m.submit.txPlaceholder}
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
                aria-label={m.submit.submitAria}
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
                <span>{target ? target.name : m.submit.loadingPrograms}</span>
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
              aria-label={m.submit.payoutAria}
              placeholder={m.submit.payoutPlaceholder}
              onChange={(event) => setPayout(event.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-zinc-900 outline-none placeholder:font-sans placeholder:text-[14px] placeholder:text-zinc-400"
            />
          </label>
        </div>
      </div>

      <p
        className={cn(
          'min-h-5 px-4 text-[13px]',
          errorMessage ? 'text-destructive' : 'text-zinc-500',
          !errorMessage && !statusMessage && 'invisible'
        )}
      >
        {errorMessage ?? statusMessage ?? 'placeholder'}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <ActionChip
          icon={FlaskConical}
          iconColor="#2F6F5E"
          label={m.submit.useSampleExploit}
          disabled={preparing !== null}
          onClick={() => void fillSample('exploit')}
        />
        <ActionChip
          icon={Scale}
          iconColor="#62558A"
          label={m.submit.useHonestTx}
          disabled={preparing !== null}
          onClick={() => void fillSample('honest')}
        />
        <ActionChip
          icon={PenLine}
          iconColor="#0047BB"
          label={wallet.isConnected ? m.submit.signWithWallet : m.submit.connectToSign}
          disabled={preparing !== null}
          onClick={() => void signWithWallet()}
        />
      </div>

      <p className="pt-2 text-center text-[12.5px] text-zinc-400">
        {m.submit.expiryHint}
      </p>
    </div>
  )
}

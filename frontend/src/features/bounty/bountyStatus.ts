import type { Messages } from '@/lib/i18n'
import { formatSol, formatSolCompact } from '@/lib/format'
import type { Bounty } from '@/types/bounty'

export function canSubmitTo(bounty: Bounty): boolean {
  return (bounty.status === 'active' || bounty.status === 'cancel_pending') && !bounty.vaultPaused
}

export interface ProtectionRow {
  id: string
  text: string
  verified: boolean
  explorerAddress?: string
}

export interface ProtectionCondition {
  id: string
  title: string
  summary: string
  verified: boolean
  rows: ProtectionRow[]
}

function getProtectionChecks(bounty: Bounty) {
  return {
    isFunded: bounty.status !== 'inactive',
    guardianIsBounty: bounty.guardian === bounty.bountyAccount,
  }
}

/** 赏金详情页的 4 条保护条件，每条都可以由链上账户直接核对。 */
export function getProtectionConditions(bounty: Bounty, m: Messages): ProtectionCondition[] {
  const text = m.bounty.conditions
  const amount = formatSolCompact(bounty.amountLamports)
  const threshold = formatSolCompact(bounty.thresholdLamports)
  const { isFunded, guardianIsBounty } = getProtectionChecks(bounty)

  return [
    {
      id: 'bounty',
      title: text.bountyTitle,
      summary: text.bountySummary(amount),
      verified: isFunded,
      rows: [
        { id: 'held', text: text.bountyHeld(amount), verified: isFunded, explorerAddress: bounty.bountyAccount },
        { id: 'status', text: text.bountyStatus(m.bounty.status[bounty.status]), verified: isFunded },
      ],
    },
    {
      id: 'invariant',
      title: text.invariantTitle,
      summary: text.invariantSummary,
      verified: true,
      rows: [
        { id: 'rule', text: text.invariantRule(threshold), verified: true },
        {
          id: 'current',
          text: text.invariantCurrent(formatSol(bounty.vaultBalanceLamports)),
          verified: true,
          explorerAddress: bounty.vault,
        },
      ],
    },
    {
      id: 'guardian',
      title: text.guardianTitle,
      summary: text.guardianSummary,
      verified: guardianIsBounty,
      rows: [
        {
          id: 'guardian',
          text: text.guardianIsBounty,
          verified: guardianIsBounty,
          explorerAddress: bounty.vaultProgramId,
        },
        { id: 'vault', text: bounty.vaultPaused ? text.vaultPaused : text.vaultLive, verified: true },
      ],
    },
    {
      id: 'timelock',
      title: text.timelockTitle,
      summary: text.timelockSummary(bounty.timelockDays),
      verified: true,
      rows: [
        { id: 'rule', text: text.timelockRule(bounty.timelockDays), verified: true },
        {
          id: 'cancel',
          text: bounty.status === 'cancel_pending' ? text.cancelRequested : text.noCancel,
          verified: bounty.status !== 'cancel_pending',
        },
      ],
    },
  ]
}

export function getProtectionProgress(bounty: Bounty): number {
  // 不变量和时间锁由程序本身保证，恒为已核验。
  const { isFunded, guardianIsBounty } = getProtectionChecks(bounty)
  const verified = [isFunded, true, guardianIsBounty, true]
  return Math.round((verified.filter(Boolean).length / verified.length) * 100)
}

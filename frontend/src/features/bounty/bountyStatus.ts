import { formatSol, formatSolCompact } from '@/lib/format'
import type { Bounty, BountyStatus } from '@/types/bounty'

export const bountyStatusLabels: Record<BountyStatus, string> = {
  active: 'Active',
  cancel_pending: 'Cancel pending',
  paid: 'Paid',
  inactive: 'Inactive',
}

export function canSubmitTo(bounty: Bounty): boolean {
  return (bounty.status === 'active' || bounty.status === 'cancel_pending') && !bounty.vaultPaused
}

export interface ProtectionRow {
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

/** 赏金详情页的 4 条保护条件，每条都可以由链上账户直接核对。 */
export function getProtectionConditions(bounty: Bounty): ProtectionCondition[] {
  const amount = formatSolCompact(bounty.amountLamports)
  const threshold = formatSolCompact(bounty.thresholdLamports)
  const guardianIsBounty = bounty.guardian === bounty.bountyAccount
  const isFunded = bounty.status !== 'inactive'

  return [
    {
      id: 'bounty',
      title: 'Bounty locked',
      summary: `${amount} is held by the bounty program, not by the protocol team. It can only leave through a verified report or a timelocked cancel.`,
      verified: isFunded,
      rows: [
        { text: `${amount} in the bounty account`, verified: isFunded, explorerAddress: bounty.bountyAccount },
        { text: `Status: ${bountyStatusLabels[bounty.status]}`, verified: isFunded },
      ],
    },
    {
      id: 'invariant',
      title: 'Invariant',
      summary:
        'The condition a valid exploit must break. The enclave measures it before and after simulating your transaction.',
      verified: true,
      rows: [
        { text: `Vault balance must stay ≥ ${threshold}`, verified: true },
        {
          text: `Current vault balance: ${formatSol(bounty.vaultBalanceLamports)}`,
          verified: true,
          explorerAddress: bounty.vault,
        },
      ],
    },
    {
      id: 'guardian',
      title: 'Guardian',
      summary:
        'The bounty program is the only account allowed to pause this vault, so the payout and the pause happen in one transaction.',
      verified: guardianIsBounty,
      rows: [
        { text: 'Vault guardian is the bounty account', verified: guardianIsBounty, explorerAddress: bounty.vaultProgramId },
        { text: bounty.vaultPaused ? 'Vault: Paused' : 'Vault: Live', verified: true },
      ],
    },
    {
      id: 'timelock',
      title: 'Withdrawal timelock',
      summary: `The protocol must give ${bounty.timelockDays} days notice before pulling the bounty, and the bounty stays claimable during that time.`,
      verified: true,
      rows: [
        { text: `${bounty.timelockDays}-day notice enforced by the program`, verified: true },
        {
          text: bounty.status === 'cancel_pending' ? 'Cancel requested' : 'No cancel requested',
          verified: bounty.status !== 'cancel_pending',
        },
      ],
    },
  ]
}

export function getProtectionProgress(bounty: Bounty): number {
  const conditions = getProtectionConditions(bounty)
  return Math.round((conditions.filter((condition) => condition.verified).length / conditions.length) * 100)
}

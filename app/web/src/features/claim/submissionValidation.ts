import { isBase58Address, isBase64 } from '@/lib/bytes'
import type { Messages } from '@/lib/i18n'

// 与 bounty-cre 工作流的 parseSubmission 规则保持一致。
export const MIN_TX_BASE64_LENGTH = 80

export function normalizeTransaction(value: string): string {
  return value.replace(/\s+/g, '')
}

export function isSealableTransaction(tx: string): boolean {
  return tx.length >= MIN_TX_BASE64_LENGTH && isBase64(tx)
}

export function getTransactionError(draft: string, m: Messages): string | null {
  const tx = normalizeTransaction(draft)
  if (tx.length === 0) return null
  if (!isBase64(tx)) return m.submit.invalidBase64
  return null
}

export function getPayoutError(payout: string, forbiddenAddresses: string[], m: Messages): string | null {
  const value = payout.trim()
  if (value.length === 0) return null
  if (!isBase58Address(value)) return m.submit.invalidPayout
  if (forbiddenAddresses.includes(value)) return m.submit.payoutForbidden
  return null
}

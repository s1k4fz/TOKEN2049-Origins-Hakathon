import { isBase58Address, isBase64 } from '@/lib/bytes'

// 与 bounty-cre 工作流的 parseSubmission 规则保持一致。
export const MIN_TX_BASE64_LENGTH = 80

export function normalizeTransaction(value: string): string {
  return value.replace(/\s+/g, '')
}

export function isSealableTransaction(tx: string): boolean {
  return tx.length >= MIN_TX_BASE64_LENGTH && isBase64(tx)
}

export function getTransactionError(draft: string): string | null {
  const tx = normalizeTransaction(draft)
  if (tx.length === 0) return null
  if (!isBase64(tx)) return 'This is not a base64-encoded transaction.'
  return null
}

export function getPayoutError(payout: string, forbiddenAddresses: string[]): string | null {
  const value = payout.trim()
  if (value.length === 0) return null
  if (!isBase58Address(value)) return 'Payout must be a base58 Solana address.'
  if (forbiddenAddresses.includes(value)) return 'Payout cannot be the vault or the bounty account.'
  return null
}

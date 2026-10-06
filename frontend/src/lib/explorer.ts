import { SOLANA_CLUSTER } from '@/lib/constants'

const EXPLORER_BASE_URL = 'https://explorer.solana.com'

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE_URL}/address/${address}?cluster=${SOLANA_CLUSTER}`
}

export function explorerTxUrl(signature: string): string {
  return `${EXPLORER_BASE_URL}/tx/${signature}?cluster=${SOLANA_CLUSTER}`
}

import { LAMPORTS_PER_SOL } from '@/lib/constants'

export function formatSol(lamports: number, fractionDigits = 3): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(fractionDigits)} SOL`
}

/** 整数 SOL 不带小数（10 SOL），否则保留三位。 */
export function formatSolCompact(lamports: number): string {
  return lamports % LAMPORTS_PER_SOL === 0
    ? `${lamports / LAMPORTS_PER_SOL} SOL`
    : formatSol(lamports)
}

export function shortAddress(address: string): string {
  return address.length <= 8 ? address : `${address.slice(0, 3)}…${address.slice(-3)}`
}

export function shortHash(hex: string): string {
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

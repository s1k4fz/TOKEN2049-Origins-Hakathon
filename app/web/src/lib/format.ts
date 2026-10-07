import { LAMPORTS_PER_SOL } from '@/lib/constants'

export function formatSol(lamports: number, fractionDigits = 3): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(fractionDigits)} SOL`
}

/** 赏金、阈值这类整额去掉末尾的 0（10 SOL、0.5 SOL），最多保留三位。 */
export function formatSolCompact(lamports: number): string {
  return `${Number((lamports / LAMPORTS_PER_SOL).toFixed(3))} SOL`
}

export function shortAddress(address: string): string {
  return address.length <= 8 ? address : `${address.slice(0, 3)}…${address.slice(-3)}`
}

export function shortHash(hex: string): string {
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`
}

export function formatShortDate(iso: string, locale = 'en-US'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export function formatTime(iso: string, locale = 'en-US'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

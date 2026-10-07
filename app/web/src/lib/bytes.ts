const BASE58_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const BASE64_PATTERN = /^[A-Za-z0-9+/]+=*$/

export function isBase58Address(value: string): boolean {
  return BASE58_ADDRESS_PATTERN.test(value)
}

export function isBase64(value: string): boolean {
  return BASE64_PATTERN.test(value)
}

export function base64ByteLength(value: string): number {
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0
  return Math.floor((value.length * 3) / 4) - padding
}

export function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** 交易字节的 sha256，与后端记录的 txSha256 一致。 */
export async function sha256OfBase64(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', base64ToBytes(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

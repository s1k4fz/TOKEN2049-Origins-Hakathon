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

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

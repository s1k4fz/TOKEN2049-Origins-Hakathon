/** 用固定种子生成看起来像已签名交易的 base64，仅供演示粘贴。 */
function makeSampleTransaction(seed: number, byteLength: number): string {
  let state = seed
  const bytes = new Uint8Array(byteLength)
  for (let index = 0; index < byteLength; index += 1) {
    state = (state * 1103515245 + 12345) % 2147483648
    bytes[index] = state % 256
  }
  return btoa(String.fromCharCode(...bytes))
}

export const SAMPLE_EXPLOIT_TX = makeSampleTransaction(2049, 412)
export const SAMPLE_HONEST_TX = makeSampleTransaction(7, 356)

export const SAMPLE_PAYOUT = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg3dQ'

export const BUILD_TX_COMMAND = 'bun script/chain.ts attack-tx exploit'

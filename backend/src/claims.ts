import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PublicKey } from '@solana/web3.js'
import { config } from './config.ts'
import { simulate } from './cre.ts'
import { bounty, getBalance, getSlot, readState, rearm, submitReport, vault } from './solana.ts'

export type ClaimStage = 'submitted' | 'simulating' | 'measured' | 'reported' | 'settled'

/** 与前端 `types/claim.ts` 同构；`at` 是相对提交时刻的毫秒数。 */
export type ClaimEvent =
  | { type: 'submitted'; at: number }
  | { type: 'simulating'; at: number }
  | { type: 'log'; at: number; line: string }
  | {
      type: 'measured'
      at: number
      preLamports: number
      postLamports: number
      thresholdLamports: number
      slot: number
    }
  | { type: 'reported'; at: number; reportHex: string }
  | {
      type: 'settled'
      at: number
      signature: string
      payoutDeltaLamports: number
      vaultBalanceLamports: number
      vaultPaused: boolean
    }
  | { type: 'rejected'; at: number }
  | { type: 'failed'; at: number; stage: ClaimStage; message: string }

type EventInput = ClaimEvent extends infer E ? (E extends ClaimEvent ? Omit<E, 'at'> : never) : never

export interface Claim {
  id: string
  bountyId: string
  bountyName: string
  vault: string
  payout: string
  txBytes: number
  txSha256: string
  createdAt: string
  events: ClaimEvent[]
}

export const BOUNTY_ID = 'vault'
export const BOUNTY_NAME = 'Vulnerable Vault'

const storePath = join(config.dataDir, 'claims.json')
mkdirSync(config.dataDir, { recursive: true })
const claims: Claim[] = existsSync(storePath) ? (JSON.parse(readFileSync(storePath, 'utf8')) as Claim[]) : []

const persist = () => writeFileSync(storePath, JSON.stringify(claims))

export function listClaims(): Claim[] {
  return claims
}

export function getClaim(id: string): Claim | undefined {
  return claims.find((claim) => claim.id === id)
}

function emit(claim: Claim, event: EventInput) {
  claim.events.push({ ...event, at: Date.now() - Date.parse(claim.createdAt) } as ClaimEvent)
  persist()
}

const LOG_LINE_MAX = 140
const NOISE = [/^Initializing/, /^Loading settings/, /^HTTP: /, /Simulation complete/, /cre account access/, /Ready to deploy/]

/** 把 CRE CLI 的输出整理成日志面板的一行；边框、提示语这类噪音直接丢掉。 */
function toLogLine(raw: string): string | null {
  let line = raw.trim().replace(/^\d{4}-\d{2}-\d{2}T\S+Z\s+/, '')
  if (!line) return null
  if (/^[╭╰│]/.test(line)) {
    return /AWS Nitro/.test(line) ? 'tee      handler requested AWS Nitro (us-west-2) · simulated locally' : null
  }
  if (NOISE.some((pattern) => pattern.test(line))) return null

  const report = line.match(/SOLANA_REPORT=(0x[0-9a-f]{16})/)
  if (report) return `enclave  report body ${report[1]}… · 96 bytes`
  line = line
    .replace(/^\[USER LOG\]\s*/, 'enclave  ')
    .replace(/^\[SIMULATION\]\s*/, 'sim      ')
    .replace(/^✗ /, 'enclave  ✗ ')
    .replace(/^Binary hash: ([0-9a-f]{12})[0-9a-f]+/, 'cre      workflow binary $1…')
    .replace(/^Config hash: ([0-9a-f]{12})[0-9a-f]+/, 'cre      config $1…')
    .replace(/^(Checking RPC connectivity|Compiling workflow)\.\.\./, 'cre      $1')
    .replace(/^✓ /, 'cre      ✓ ')
  return line.length > LOG_LINE_MAX ? `${line.slice(0, LOG_LINE_MAX)}…` : line
}

let queue: Promise<void> = Promise.resolve()
let rearmTimer: NodeJS.Timeout | null = null

export function createClaim(input: { bountyId: string; payout: string; tx: string }): Claim {
  const txBytes = Buffer.from(input.tx, 'base64').length
  const claim: Claim = {
    id: `c_${randomBytes(3).toString('hex')}`,
    bountyId: input.bountyId,
    bountyName: BOUNTY_NAME,
    vault: vault.toBase58(),
    payout: input.payout,
    txBytes,
    txSha256: createHash('sha256').update(Buffer.from(input.tx, 'base64')).digest('hex'),
    createdAt: new Date().toISOString(),
    events: [],
  }
  claims.unshift(claim)
  emit(claim, { type: 'submitted' })
  // 只有一份赏金，提交按顺序验证。
  queue = queue.then(() => runClaim(claim, input.tx)).catch((error: unknown) => {
    emit(claim, { type: 'failed', stage: 'simulating', message: String(error) })
  })
  return claim
}

async function runClaim(claim: Claim, tx: string): Promise<void> {
  const state = await readState()
  if (state.vaultPaused || !state.active) {
    emit(claim, {
      type: 'failed',
      stage: 'submitted',
      message: 'The vault is paused because this bounty was just paid. The demo reopens it in about a minute.',
    })
    return
  }

  emit(claim, { type: 'simulating' })
  emit(claim, { type: 'log', line: `cre      workflow bounty-cre · confidential handler · rpc ${config.cluster}` })
  const result = await simulate(claim.payout, tx, (raw) => {
    const line = toLogLine(raw)
    if (line) emit(claim, { type: 'log', line })
  })

  if (result.kind === 'error') {
    emit(claim, { type: 'failed', stage: 'simulating', message: result.message })
    return
  }

  const thresholdLamports = Number(config.thresholdLamports)
  emit(claim, {
    type: 'measured',
    preLamports: result.pre,
    postLamports: result.post,
    thresholdLamports,
    slot: result.kind === 'broken' ? result.slot : await getSlot(),
  })

  if (result.kind === 'held') {
    emit(claim, { type: 'log', line: 'enclave  pre ≥ threshold && post < threshold = false · no report' })
    emit(claim, { type: 'rejected' })
    return
  }

  emit(claim, { type: 'log', line: 'cre      report encoded (solana · ecdsa · keccak256) · 96 bytes' })
  emit(claim, { type: 'reported', reportHex: result.reportHex.replace(/^0x/, '') })

  try {
    const payout = new PublicKey(claim.payout)
    const before = await getBalance(payout)
    emit(claim, { type: 'log', line: 'chain    forwarder submitting on_report to the bounty program' })
    const signature = await submitReport(result.reportHex)
    const [after, state] = await Promise.all([getBalance(payout), readState()])
    emit(claim, { type: 'log', line: `chain    confirmed ${signature.slice(0, 8)}… · vault paused · bounty paid` })
    emit(claim, {
      type: 'settled',
      signature,
      payoutDeltaLamports: after - before,
      vaultBalanceLamports: state.vaultLamports,
      vaultPaused: state.vaultPaused,
    })
    scheduleRearm()
  } catch (error) {
    emit(claim, { type: 'failed', stage: 'settled', message: `on_report failed: ${String(error).slice(0, 240)}` })
  }
}

export function scheduleRearm(delayMs = config.rearmDelayMs) {
  if (rearmTimer) clearTimeout(rearmTimer)
  rearmTimer = setTimeout(() => {
    rearmTimer = null
    queue = queue
      .then(async () => {
        const signature = await rearm()
        if (signature) console.log('rearmed', signature)
      })
      .catch((error: unknown) => console.error('rearm failed', error))
  }, delayMs)
}

export function bountyAccount(): string {
  return bounty.toBase58()
}

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { PublicKey } from '@solana/web3.js'
import { config } from './config.ts'
import { BOUNTY_ID, BOUNTY_NAME, createClaim, getClaim, listClaims, scheduleRearm } from './claims.ts'
import { buildAttackTx, bounty, dripIfNeeded, keys, readState, vault } from './solana.ts'

const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const BASE64 = /^[A-Za-z0-9+/]+=*$/
const MAX_BODY_BYTES = 64 * 1024

const DESCRIPTION =
  'A demo lending vault on Solana Devnet with deposits, withdrawals and flash loans. Any transaction that drains it below the threshold earns the full bounty, and the vault is paused in the same transaction.'

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) throw new Error('body too large')
    chunks.push(chunk as Buffer)
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

function claimOutcome(claimId: string): 'verifying' | 'paid' | 'rejected' | 'failed' {
  const events = getClaim(claimId)?.events ?? []
  if (events.some((event) => event.type === 'settled')) return 'paid'
  if (events.some((event) => event.type === 'rejected')) return 'rejected'
  if (events.some((event) => event.type === 'failed')) return 'failed'
  return 'verifying'
}

async function getBounty() {
  const state = await readState()
  const claims = listClaims().filter((claim) => claim.bountyId === BOUNTY_ID)
  const latest = claims[0]
  const status = state.active
    ? state.cancelPending
      ? 'cancel_pending'
      : 'active'
    : state.claimed
      ? 'paid'
      : 'inactive'
  return {
    id: BOUNTY_ID,
    name: BOUNTY_NAME,
    description: DESCRIPTION,
    vaultProgramId: keys.vaultProgram.toBase58(),
    vault: vault.toBase58(),
    bountyProgramId: keys.bountyProgram.toBase58(),
    bountyAccount: bounty.toBase58(),
    guardian: state.guardian,
    amountLamports: state.amountLamports || Number(config.bountyLamports),
    thresholdLamports: state.thresholdLamports || Number(config.thresholdLamports),
    vaultBalanceLamports: state.vaultLamports,
    vaultPaused: state.vaultPaused,
    status,
    timelockDays: config.timelockDays,
    submissionCount: claims.length,
    latestSubmission: latest ? { claimId: latest.id, outcome: claimOutcome(latest.id), payout: latest.payout } : null,
  }
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = url.pathname

  if (req.method === 'GET' && path === '/api/health') return sendJson(res, 200, { ok: true })

  if (req.method === 'GET' && path === '/api/config') {
    return sendJson(res, 200, {
      cluster: config.cluster,
      vaultProgramId: keys.vaultProgram.toBase58(),
      bountyProgramId: keys.bountyProgram.toBase58(),
      vault: vault.toBase58(),
      bounty: bounty.toBase58(),
      samplePayout: keys.payout.publicKey.toBase58(),
    })
  }

  if (req.method === 'GET' && path === '/api/bounties') return sendJson(res, 200, [await getBounty()])

  if (req.method === 'GET' && path.startsWith('/api/bounties/')) {
    const id = decodeURIComponent(path.slice('/api/bounties/'.length))
    return id === BOUNTY_ID ? sendJson(res, 200, await getBounty()) : sendJson(res, 404, { error: 'not found' })
  }

  if (req.method === 'GET' && path === '/api/claims') return sendJson(res, 200, listClaims())

  if (req.method === 'GET' && path.startsWith('/api/claims/')) {
    const claim = getClaim(decodeURIComponent(path.slice('/api/claims/'.length)))
    return claim ? sendJson(res, 200, claim) : sendJson(res, 404, { error: 'not found' })
  }

  if (req.method === 'POST' && path === '/api/claims') {
    const body = (await readBody(req)) as { bountyId?: unknown; payout?: unknown; tx?: unknown }
    const payout = typeof body.payout === 'string' ? body.payout.trim() : ''
    const tx = typeof body.tx === 'string' ? body.tx.replace(/\s+/g, '') : ''
    if (body.bountyId !== BOUNTY_ID) return sendJson(res, 400, { error: 'unknown bounty' })
    if (!BASE58_ADDRESS.test(payout)) return sendJson(res, 400, { error: 'payout must be a base58 address' })
    if (payout === vault.toBase58() || payout === bounty.toBase58()) {
      return sendJson(res, 400, { error: 'payout cannot be the vault or the bounty account' })
    }
    if (!BASE64.test(tx) || tx.length < 80) return sendJson(res, 400, { error: 'transaction is not base64' })
    return sendJson(res, 201, createClaim({ bountyId: BOUNTY_ID, payout, tx }))
  }

  if (req.method === 'POST' && path === '/api/sample-tx') {
    const body = (await readBody(req)) as { mode?: unknown; signer?: unknown }
    const mode = body.mode === 'honest' ? 'honest' : 'exploit'
    if (typeof body.signer === 'string') {
      if (!BASE58_ADDRESS.test(body.signer)) return sendJson(res, 400, { error: 'signer must be a base58 address' })
      const signer = new PublicKey(body.signer)
      const drip = await dripIfNeeded(signer)
      return sendJson(res, 200, { tx: await buildAttackTx(mode, signer), signed: false, payout: body.signer, drip })
    }
    return sendJson(res, 200, {
      tx: await buildAttackTx(mode),
      signed: true,
      payout: keys.payout.publicKey.toBase58(),
      drip: null,
    })
  }

  sendJson(res, 404, { error: 'not found' })
}

createServer((req, res) => {
  route(req, res).catch((error: unknown) => {
    console.error(error)
    if (!res.headersSent) sendJson(res, 500, { error: String(error).slice(0, 300) })
  })
}).listen(config.port, '127.0.0.1', () => {
  console.log(`silentclaim backend on 127.0.0.1:${config.port} · rpc ${config.rpcUrl}`)
})

readState()
  .then((state) => {
    if (!state.active) scheduleRearm(1000)
  })
  .catch((error: unknown) => console.error('initial state read failed', error))

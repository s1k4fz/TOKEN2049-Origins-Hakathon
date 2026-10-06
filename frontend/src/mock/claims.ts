import { formatSol } from '@/lib/format'
import { mockPrograms, type MockProgram } from '@/mock/programs'
import { SAMPLE_HONEST_TX } from '@/mock/sampleTransactions'
import type { Claim, ClaimEvent, CreateClaimInput } from '@/types/claim'

const POST_EXPLOIT_LAMPORTS = 2_039_280
const MOCK_SLOT = 3_141_592
const MOCK_SIGNATURE =
  '5Hk2vR8nX3qT7wYbLm4cZ9sJd6eFg1uAp2oKr5tWx8yNh3vBq7jMc4zRs6dTf9gUa2kPe5wXn8bCy3mVh7r9QaP'

function toHexU64(value: number): string {
  return BigInt(value).toString(16).padStart(16, '0')
}

function enclaveLogs(program: MockProgram, txBytes: number, postLamports: number): ClaimEvent[] {
  return [
    { type: 'log', at: 1100, line: 'cre      workflow bounty-cre · handler in TEE (nitro, us-west-2)' },
    {
      type: 'log',
      at: 1700,
      line: `enclave  getBalance(vault) = ${formatSol(program.vaultBalanceLamports, 9)} · slot ${MOCK_SLOT}`,
    },
    { type: 'log', at: 2300, line: 'enclave  simulateTransaction(sigVerify = true, accounts = [vault])' },
    { type: 'log', at: 2700, line: `enclave  exploit transaction = [redacted · ${txBytes} bytes]` },
    { type: 'log', at: 3100, line: `enclave  post-state vault = ${formatSol(postLamports, 9)}` },
  ]
}

function measured(program: MockProgram, postLamports: number): ClaimEvent {
  return {
    type: 'measured',
    at: 3600,
    preLamports: program.vaultBalanceLamports,
    postLamports,
    thresholdLamports: program.thresholdLamports,
    slot: MOCK_SLOT,
  }
}

function paidScript(program: MockProgram, txBytes: number): ClaimEvent[] {
  return [
    { type: 'submitted', at: 0 },
    { type: 'simulating', at: 700 },
    ...enclaveLogs(program, txBytes, POST_EXPLOIT_LAMPORTS),
    measured(program, POST_EXPLOIT_LAMPORTS),
    { type: 'log', at: 3700, line: 'enclave  pre ≥ threshold && post < threshold = true' },
    { type: 'log', at: 4800, line: 'cre      report encoded (solana · ecdsa · keccak256) · 96 bytes' },
    {
      type: 'reported',
      at: 4900,
      reportHex: [
        toHexU64(program.vaultBalanceLamports),
        toHexU64(POST_EXPLOIT_LAMPORTS),
        toHexU64(MOCK_SLOT),
        toHexU64(program.thresholdLamports),
      ]
        .join('')
        .padEnd(192, 'a'),
    },
    { type: 'log', at: 5500, line: 'chain    forwarder submitted on_report to the bounty program' },
    { type: 'log', at: 6300, line: 'chain    confirmed · vault paused · bounty paid' },
    {
      type: 'settled',
      at: 6400,
      signature: MOCK_SIGNATURE,
      payoutDeltaLamports: program.amountLamports,
      vaultBalanceLamports: program.vaultBalanceLamports,
      vaultPaused: true,
    },
  ]
}

function rejectedScript(program: MockProgram, txBytes: number): ClaimEvent[] {
  return [
    { type: 'submitted', at: 0 },
    { type: 'simulating', at: 700 },
    ...enclaveLogs(program, txBytes, program.vaultBalanceLamports),
    measured(program, program.vaultBalanceLamports),
    { type: 'log', at: 3650, line: 'enclave  pre ≥ threshold && post < threshold = false · no report' },
    { type: 'rejected', at: 3700 },
  ]
}

function pausedScript(): ClaimEvent[] {
  return [
    { type: 'submitted', at: 0 },
    { type: 'simulating', at: 700 },
    {
      type: 'failed',
      at: 1600,
      stage: 'simulating',
      message: 'The vault is paused. This bounty has already been paid.',
    },
  ]
}

export function claimSettledAt(claim: Claim, now: number): Extract<ClaimEvent, { type: 'settled' }> | null {
  const elapsed = now - Date.parse(claim.createdAt)
  const settled = claim.events.find((event) => event.type === 'settled')
  return settled && settled.type === 'settled' && settled.at <= elapsed ? settled : null
}

const [defaultProgram] = mockPrograms

export const mockClaims: Claim[] = [
  {
    id: 'c_01',
    bountyId: defaultProgram.id,
    bountyName: defaultProgram.name,
    vault: defaultProgram.vault,
    payout: '9PqZ4rTn8WcXk2sVd6yFa3mB8eJu5oHg1hRi7Lm',
    txBytes: 356,
    txSha256: 'b71c0e9a4f2d8836c5a1e07b9d3f62a4e8c15b0d7a9f3e6c2b4d8a1f0e5c9d7e',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    events: rejectedScript(defaultProgram, 356),
  },
]

export function createMockClaim(
  input: CreateClaimInput,
  meta: { txBytes: number; txSha256: string }
): Claim {
  const program = mockPrograms.find((item) => item.id === input.bountyId) ?? defaultProgram
  const now = Date.now()
  const alreadyPaid = mockClaims.some(
    (claim) => claim.bountyId === program.id && claimSettledAt(claim, now) !== null
  )
  const events = alreadyPaid
    ? pausedScript()
    : input.tx === SAMPLE_HONEST_TX
      ? rejectedScript(program, meta.txBytes)
      : paidScript(program, meta.txBytes)

  const claim: Claim = {
    id: `c_${String(mockClaims.length + 1).padStart(2, '0')}`,
    bountyId: program.id,
    bountyName: program.name,
    vault: program.vault,
    payout: input.payout,
    txBytes: meta.txBytes,
    txSha256: meta.txSha256,
    createdAt: new Date(now).toISOString(),
    events,
  }
  mockClaims.unshift(claim)
  return claim
}

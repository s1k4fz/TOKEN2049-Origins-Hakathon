import { formatSolCompact, shortAddress } from '@/lib/format'
import { claimSettledAt, mockClaims } from '@/mock/claims'
import { mockPrograms, type MockProgram } from '@/mock/programs'
import type { Bounty } from '@/types/bounty'
import type { Claim } from '@/types/claim'

function summarizeClaim(claim: Claim, program: MockProgram, now: number): string {
  const elapsed = now - Date.parse(claim.createdAt)
  const reached = claim.events.filter((event) => event.at <= elapsed)
  if (reached.some((event) => event.type === 'settled')) {
    return `Paid ${formatSolCompact(program.amountLamports)} to ${shortAddress(claim.payout)}`
  }
  if (reached.some((event) => event.type === 'rejected')) return 'Rejected · invariant held'
  if (reached.some((event) => event.type === 'failed')) return 'Failed'
  return 'Verifying…'
}

function toBounty(program: MockProgram, now: number): Bounty {
  const claims = mockClaims.filter((claim) => claim.bountyId === program.id)
  const settled = claims.map((claim) => claimSettledAt(claim, now)).find((event) => event !== null)
  const latest = claims[0]

  return {
    id: program.id,
    name: program.name,
    description: program.description,
    vaultProgramId: program.vaultProgramId,
    vault: program.vault,
    bountyProgramId: program.bountyProgramId,
    bountyAccount: program.bountyAccount,
    guardian: program.bountyAccount,
    amountLamports: program.amountLamports,
    thresholdLamports: program.thresholdLamports,
    vaultBalanceLamports: settled?.vaultBalanceLamports ?? program.vaultBalanceLamports,
    vaultPaused: settled?.vaultPaused ?? false,
    status: settled ? 'paid' : 'active',
    timelockDays: program.timelockDays,
    submissionCount: claims.length,
    latestSubmission: latest
      ? { claimId: latest.id, summary: summarizeClaim(latest, program, now) }
      : null,
  }
}

export function listMockBounties(): Bounty[] {
  const now = Date.now()
  return mockPrograms.map((program) => toBounty(program, now))
}

export function getMockBounty(id: string): Bounty | null {
  const program = mockPrograms.find((item) => item.id === id)
  return program ? toBounty(program, Date.now()) : null
}

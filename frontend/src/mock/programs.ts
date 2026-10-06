import { LAMPORTS_PER_SOL } from '@/lib/constants'

/** 受保护程序的静态链上配置（注册时写入、之后不变的部分）。 */
export interface MockProgram {
  id: string
  name: string
  description: string
  vaultProgramId: string
  vault: string
  bountyProgramId: string
  bountyAccount: string
  amountLamports: number
  thresholdLamports: number
  vaultBalanceLamports: number
  timelockDays: number
}

export const mockPrograms: MockProgram[] = [
  {
    id: 'vault',
    name: 'Vulnerable Vault',
    description:
      'A demo lending vault on Solana with deposits, withdrawals and flash loans. Any transaction that drains it below the threshold earns the full bounty, and the vault is paused in the same transaction.',
    vaultProgramId: 'Vau1tPrg3mXk9QwR7sTd6yFa2nZ8eJu5oHg4hRi8Vt',
    vault: 'Hn4bQ2vW7cXk9pLr3sTd6yFa1mZ8eJu5oNg2hRi8Vt',
    bountyProgramId: 'Bnty5cRe7kQw2XsTd9yFa3mZ8eJu4oHg6hRi1pLxVq',
    bountyAccount: '9vB3kqWm7XsTd2yFa5nZ8eJu4oHg6hRi1pLcQr3Ztx',
    amountLamports: 10 * LAMPORTS_PER_SOL,
    thresholdLamports: 1 * LAMPORTS_PER_SOL,
    vaultBalanceLamports: 10 * LAMPORTS_PER_SOL,
    timelockDays: 7,
  },
]

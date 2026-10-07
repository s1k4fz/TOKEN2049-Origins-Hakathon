import { resolve } from 'node:path'

const LAMPORTS_PER_SOL = 1_000_000_000n

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') throw new Error(`${name} is not set`)
  return value
}

function readSol(name: string, fallback: string): bigint {
  const [whole, fraction = ''] = readEnv(name, fallback).split('.')
  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(fraction.padEnd(9, '0').slice(0, 9))
}

export const config = {
  port: Number(readEnv('PORT', '8787')),
  rpcUrl: readEnv('RPC_URL', 'https://api.devnet.solana.com'),
  cluster: readEnv('SOLANA_CLUSTER', 'devnet'),
  keysDir: resolve(readEnv('KEYS_DIR', '../../protocol/keys')),
  chainDir: resolve(readEnv('CHAIN_DIR', '../../protocol')),
  dataDir: resolve(readEnv('DATA_DIR', './data')),
  creBin: readEnv('CRE_BIN', 'cre'),
  depositLamports: readSol('DEPOSIT_SOL', '1'),
  thresholdLamports: readSol('THRESHOLD_SOL', '0.5'),
  bountyLamports: readSol('BOUNTY_SOL', '0.1'),
  // 赔付后多久自动重置演示（解除暂停 + 重新注册），让下一位评委还能跑通。
  rearmDelayMs: Number(readEnv('REARM_DELAY_MS', '45000')),
  // 评委钱包没有 Devnet SOL 时补一点手续费和仓位租金。
  dripLamports: readSol('DRIP_SOL', '0.01'),
  timelockDays: 7,
}

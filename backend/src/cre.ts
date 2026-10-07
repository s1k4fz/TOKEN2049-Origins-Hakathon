import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { config } from './config.ts'
import { bounty, vault } from './solana.ts'

export type SimulationResult =
  | { kind: 'broken'; pre: number; post: number; slot: number; reportHex: string }
  | { kind: 'held'; pre: number; post: number }
  | { kind: 'error'; message: string }

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g

/**
 * 在本机跑一次 `cre workflow simulate`。攻击交易只通过临时 env 文件进入工作流的 secret，
 * 跑完立即删除，日志在转发前把交易原文替换掉。
 */
export async function simulate(
  payout: string,
  tx: string,
  onLine: (line: string) => void
): Promise<SimulationResult> {
  const dir = mkdtempSync(join(tmpdir(), 'silentclaim-'))
  const envFile = join(dir, 'secrets.env')
  const configFile = join(dir, 'config.json')
  writeFileSync(envFile, `SECRET_ATTACK_TX=${payout}:${tx}\n`, { mode: 0o600 })
  writeFileSync(
    configFile,
    JSON.stringify({
      schedule: '0 */1 * * * *',
      rpcUrl: config.rpcUrl,
      secretId: 'ATTACK_TX',
      vault: vault.toBase58(),
      bounty: bounty.toBase58(),
      threshold: config.thresholdLamports.toString(),
    })
  )

  const redact = (text: string) => text.split(`${payout}:${tx}`).join('[redacted]').split(tx).join('[redacted]')
  let output = ''

  try {
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(
        config.creBin,
        [
          'workflow',
          'simulate',
          'bounty-cre',
          '--target',
          'staging-settings',
          '--non-interactive',
          '--trigger-index',
          '0',
          '--config',
          configFile,
          '--env',
          envFile,
        ],
        {
          cwd: config.chainDir,
          env: { ...process.env, CRE_SOLANA_PRIVATE_KEY: join(config.keysDir, 'forwarder.json') },
        }
      )
      let pending = ''
      const handle = (chunk: Buffer) => {
        const text = redact(chunk.toString('utf8')).replace(ANSI, '')
        output += text
        pending += text
        const lines = pending.split(/\r?\n/)
        pending = lines.pop() ?? ''
        for (const line of lines) if (line.trim()) onLine(line)
      }
      child.stdout.on('data', handle)
      child.stderr.on('data', handle)
      child.on('error', reject)
      child.on('close', (status) => {
        if (pending.trim()) onLine(pending)
        resolve(status ?? 1)
      })
    })

    const journal = output.match(/SOLANA_JOURNAL pre=(\d+) post=(\d+) slot=(\d+) payout=([1-9A-HJ-NP-Za-km-z]+)/)
    const report = output.match(/SOLANA_REPORT=(0x[0-9a-f]{192})/)
    if (code === 0 && journal && report) {
      return {
        kind: 'broken',
        pre: Number(journal[1]),
        post: Number(journal[2]),
        slot: Number(journal[3]),
        reportHex: report[1],
      }
    }
    const held = output.match(/predicate failed pre=(\d+) post=(\d+)/)
    if (held) return { kind: 'held', pre: Number(held[1]), post: Number(held[2]) }
    const failure =
      output.match(/simulateTransaction failed: ([^\n]+)/)?.[1] ??
      output.match(/(payout must not be[^\n]*|submission must be[^\n]*|transaction is not base64[^\n]*)/)?.[1] ??
      `cre workflow simulate exited with code ${code}`
    return { kind: 'error', message: failure.trim().slice(0, 300) }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

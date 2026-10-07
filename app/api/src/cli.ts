import { bounty, initChain, keys, readState, rearm, vault } from './solana.ts'

const command = process.argv[2]

if (command === 'addresses') {
  console.log(`PAYER=${keys.payer.publicKey.toBase58()}`)
  console.log(`FORWARDER=${keys.forwarder.publicKey.toBase58()}`)
  console.log(`ATTACKER=${keys.attacker.publicKey.toBase58()}`)
  console.log(`PAYOUT=${keys.payout.publicKey.toBase58()}`)
  console.log(`VAULT_PROGRAM_ID=${keys.vaultProgram.toBase58()}`)
  console.log(`BOUNTY_PROGRAM_ID=${keys.bountyProgram.toBase58()}`)
  console.log(`VAULT=${vault.toBase58()}`)
  console.log(`BOUNTY=${bounty.toBase58()}`)
} else if (command === 'init') {
  await initChain()
  console.log(await readState())
} else if (command === 'rearm') {
  console.log(await rearm())
} else if (command === 'status') {
  console.log(await readState())
} else {
  console.error('usage: bun src/cli.ts addresses|init|rearm|status')
  process.exit(1)
}

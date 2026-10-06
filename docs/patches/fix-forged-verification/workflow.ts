import { cre, hexToBase64, json, ok, type TeeRuntime } from '@chainlink/cre-sdk'
import {
  concatHex,
  decodeAbiParameters,
  encodeAbiParameters,
  type Address,
  type Hex,
  isAddress,
  parseAbiParameters,
  stringToHex,
} from 'viem'
import { z } from 'zod'

export const configSchema = z.object({
  schedule: z.string(),
  rpcUrl: z.string(),
  secretId: z.string(),
  chainId: z.string(),
  vault: z.string(),
  bounty: z.string(),
  payout: z.string(),
  value: z.string(),
  threshold: z.string(),
})

type Config = z.infer<typeof configSchema>

const REPORT_TYPES =
  'uint256 chainId, address bounty, address target, uint64 blockNumber, bytes32 blockHash, uint256 threshold, uint256 preBalance, uint256 postBalance, address payout'

// Fresh sender with no role on any target, funded only inside the simulation.
const SIM_SENDER: Address = '0x1000000000000000000000000000000000000001'
// Balance reader injected via state override: returns BALANCE(calldata[0:32]).
// The enclave measures the target itself; nothing the unpublished code returns is trusted.
const BALANCE_PROBE: Address = '0x2000000000000000000000000000000000000002'
const BALANCE_PROBE_CODE: Hex = '0x6000353160005260206000f3'
const SIM_SENDER_BUFFER = 10n ** 18n

type RpcError = { message?: string }
type RpcBody = { result?: unknown; error?: RpcError }
type BlockResult = { number?: string; hash?: string }
type SimulatedCall = { status?: string; returnData?: string }
type SimulatedBlock = { calls?: SimulatedCall[] }

const asAddress = (value: string, label: string): Address => {
  if (!isAddress(value)) {
    throw new Error(`${label} is not an address`)
  }
  return value
}

const asHex = (value: string, label: string): Hex => {
  const hex = value.startsWith('0x') ? value : `0x${value}`
  if (!/^0x[0-9a-fA-F]+$/.test(hex) || (hex.length - 2) % 2 !== 0) {
    throw new Error(`${label} is not hex`)
  }
  return hex as Hex
}

// Protobuf JSON encodes the HTTP body as base64. The secret never goes into this helper.
const postJson = (runtime: TeeRuntime<Config>, method: string, params: unknown[]): unknown => {
  const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  const response = new cre.capabilities.HTTPClient()
    .sendRequest(runtime, {
      url: runtime.config.rpcUrl,
      method: 'POST',
      body: hexToBase64(stringToHex(payload)),
      multiHeaders: { 'content-type': { values: ['application/json'] } },
    })
    .result()

  if (!ok(response)) {
    throw new Error(`anvil HTTP status ${response.statusCode} on ${method}`)
  }

  const parsed = json(response) as RpcBody
  if (parsed.error) {
    throw new Error(`anvil ${method} failed: ${parsed.error.message ?? 'unknown'}`)
  }
  if (parsed.result === undefined || parsed.result === null) {
    throw new Error(`anvil ${method} returned no result`)
  }
  return parsed.result
}

export const onCronTrigger = (runtime: TeeRuntime<Config>): string => {
  const config = runtime.config
  const vault = asAddress(config.vault, 'vault')
  const bounty = asAddress(config.bounty, 'bounty')
  const payout = asAddress(config.payout, 'payout')
  const threshold = BigInt(config.threshold)
  const value = BigInt(config.value)
  if (threshold <= 0n || value <= 0n) {
    throw new Error('threshold and value must be positive')
  }

  // Creation bytecode stays in the enclave. Do not log it, return it, or put it in the report.
  const secret = runtime.getSecret({ id: config.secretId }).result().value
  if (secret.length === 0) {
    throw new Error('creation code secret is empty')
  }
  const creation = asHex(secret, 'creation code')
  const data = concatHex([
    creation,
    encodeAbiParameters(parseAbiParameters('address'), [vault]),
  ])

  const chainId = BigInt(postJson(runtime, 'eth_chainId', []) as string)
  if (chainId !== BigInt(config.chainId)) {
    throw new Error('anvil chain id does not match config')
  }

  const block = postJson(runtime, 'eth_getBlockByNumber', ['latest', false]) as BlockResult
  if (!block.number || !block.hash) {
    throw new Error('anvil block header is missing number or hash')
  }
  const blockNumber = BigInt(block.number)
  const blockHash = asHex(block.hash, 'block hash')

  const preBalance = BigInt(postJson(runtime, 'eth_getBalance', [vault, block.number]) as string)

  // One simulated block on top of `block`: the unpublished creation, then the probe.
  const simulated = postJson(runtime, 'eth_simulateV1', [
    {
      blockStateCalls: [
        {
          stateOverrides: {
            [SIM_SENDER]: { balance: `0x${(value + SIM_SENDER_BUFFER).toString(16)}` },
            [BALANCE_PROBE]: { code: BALANCE_PROBE_CODE },
          },
          calls: [
            { from: SIM_SENDER, data, value: `0x${value.toString(16)}`, gas: '0x7a1200' },
            {
              from: SIM_SENDER,
              to: BALANCE_PROBE,
              data: encodeAbiParameters(parseAbiParameters('address'), [vault]),
            },
          ],
        },
      ],
    },
    block.number,
  ]) as SimulatedBlock[]
  const [attack, probe] = simulated[0]?.calls ?? []
  if (!attack || !probe) {
    throw new Error('eth_simulateV1 returned fewer than two calls')
  }
  if (attack.status !== '0x1') {
    throw new Error('unpublished transaction reverted')
  }
  if (probe.status !== '0x1' || !probe.returnData) {
    throw new Error('balance probe failed')
  }
  const [postBalance] = decodeAbiParameters(
    parseAbiParameters('uint256'),
    asHex(probe.returnData, 'probe result'),
  )
  if (preBalance < threshold || postBalance >= threshold) {
    throw new Error(`predicate failed pre=${preBalance} post=${postBalance}`)
  }

  const encodedPayload = encodeAbiParameters(parseAbiParameters(REPORT_TYPES), [
    chainId,
    bounty,
    vault,
    blockNumber,
    blockHash,
    threshold,
    preBalance,
    postBalance,
    payout,
  ])

  // usingTheDons() leaves the enclave. The report is the public journal plus payout.
  const donRuntime = runtime.usingTheDons()
  donRuntime
    .report({
      encodedPayload: hexToBase64(encodedPayload),
      encoderName: 'evm',
      signingAlgo: 'ecdsa',
      hashingAlgo: 'keccak256',
    })
    .result()

  // Public fields only. script/cre-demo.sh parses this line. Remove enclave logs before production.
  runtime.log(`journal pre=${preBalance} post=${postBalance} block=${blockNumber}`)
  return `CRE_JOURNAL=${encodedPayload}`
}

export function initWorkflow(config: Config) {
  const cronTrigger = new cre.capabilities.CronCapability()
  return [
    cre.handlerInTee(cronTrigger.trigger({ schedule: config.schedule }), onCronTrigger, [
      { tee: 'nitro', regions: ['us-west-2'] },
    ]),
  ]
}

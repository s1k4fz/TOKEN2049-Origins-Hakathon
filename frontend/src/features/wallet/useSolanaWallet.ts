import { useCallback } from 'react'
import type { Provider } from '@reown/appkit-adapter-solana/react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { Transaction } from '@solana/web3.js'
import { base64ToBytes, bytesToBase64 } from '@/lib/bytes'

/** 连接的 Solana 钱包：只用来签名，不让钱包广播。 */
export function useSolanaWallet() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'solana' })
  const { walletProvider } = useAppKitProvider<Provider>('solana')

  const signTransaction = useCallback(
    async (unsignedBase64: string) => {
      if (!walletProvider) throw new Error('Wallet is not connected')
      const signed = await walletProvider.signTransaction(Transaction.from(base64ToBytes(unsignedBase64)))
      return bytesToBase64(Uint8Array.from(signed.serialize()))
    },
    [walletProvider]
  )

  return {
    address: isConnected ? address : undefined,
    isConnected: isConnected && Boolean(address),
    connect: () => open({ view: 'Connect', namespace: 'solana' }),
    openAccount: () => open({ view: 'Account' }),
    signTransaction,
  }
}

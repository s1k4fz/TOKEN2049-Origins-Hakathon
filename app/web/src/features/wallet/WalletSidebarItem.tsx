import { Wallet } from 'lucide-react'
import { SidebarItem } from '@/components/SidebarItem'
import { useMessages } from '@/hooks/useMessages'
import { shortAddress } from '@/lib/format'
import { useSolanaWallet } from './useSolanaWallet'

export function WalletSidebarItem() {
  const m = useMessages()
  const wallet = useSolanaWallet()

  return (
    <SidebarItem
      icon={Wallet}
      label={wallet.address ? m.wallet.connected(shortAddress(wallet.address)) : m.wallet.connect}
      onClick={() => void (wallet.isConnected ? wallet.openAccount() : wallet.connect())}
    />
  )
}

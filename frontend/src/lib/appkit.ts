import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solanaDevnet } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { env } from '@/lib/env'
import { PRODUCT_NAME } from '@/lib/constants'

/** 在渲染前调用一次；AppKit 的 hooks 依赖这里创建的全局实例。 */
export function initAppKit() {
  createAppKit({
    adapters: [new SolanaAdapter()],
    networks: [solanaDevnet],
    defaultNetwork: solanaDevnet,
    projectId: env.reownProjectId,
    metadata: {
      name: PRODUCT_NAME,
      description: 'Trustless bug bounties settled by a Chainlink CRE confidential workflow',
      url: env.appUrl,
      icons: [`${env.appUrl}/favicon.svg`],
    },
    features: { analytics: false, email: false, socials: false, swaps: false, onramp: false, send: false },
  })
}

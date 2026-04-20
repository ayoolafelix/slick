import type { PropsWithChildren } from 'react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { runtimeConfig } from '../lib/config'

const wallets = [new PhantomWalletAdapter()]

export function WalletProviders({ children }: PropsWithChildren) {
  return (
    <ConnectionProvider endpoint={runtimeConfig.rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}


'use client';
import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
require('@solana/wallet-adapter-react-ui/styles.css');

export function WalletWrapper({ children }: { children: ReactNode }) {
  // Prefer branded HTTP RPC and optional WS endpoint
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    process.env.NEXT_PUBLIC_RPC ||
    'https://api.mainnet-beta.solana.com';
  const wsEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_WS || undefined;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

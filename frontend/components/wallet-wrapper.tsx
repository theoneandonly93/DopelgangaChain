
"use client";
import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SITE } from '@/utils/site';
require('@solana/wallet-adapter-react-ui/styles.css');

export function WalletWrapper({ children }: { children: ReactNode }) {
  // Use same-origin proxy in browser to avoid CORS; build absolute URL for web3.js
  const endpoint = useMemo(() => {
    const forceDirect = process.env.NEXT_PUBLIC_FORCE_DIRECT_RPC === '1';
    if (typeof window !== 'undefined' && !forceDirect) {
      return `${window.location.origin}/api/rpc`;
    }
    const http = SITE.rpc.http;
    return http.startsWith('http') ? http : 'https://dopel-rpc.dopelganga.workers.dev';
  }, []);
  // Prefer direct WS to the worker; WebSockets are cross-origin friendly
  const wsEndpoint = useMemo(() => {
    const ws = SITE.rpc.ws || '';
    return ws.startsWith('ws') ? ws : undefined;
  }, []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

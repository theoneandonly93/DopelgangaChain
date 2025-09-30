
"use client";
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SITE } from '@/utils/site';
import { LocalDopeWalletAdapter } from './adapters/LocalDopeWalletAdapter';
import bs58 from 'bs58';
require('@solana/wallet-adapter-react-ui/styles.css');

export function WalletWrapper({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('dopewallet:updated', onUpdate);
    return () => window.removeEventListener('dopewallet:updated', onUpdate);
  }, []);
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
  const wallets = useMemo(() => {
    const list: any[] = [new PhantomWalletAdapter()];
    // If a Dope Wallet is configured in localStorage, include the adapter
    if (typeof window !== 'undefined') {
      try {
        const skb58 = localStorage.getItem('dopeWallet:secretKey');
        if (skb58) {
          // Verify decodable; adapter will lazy-load again on connect
          bs58.decode(skb58);
          list.push(new LocalDopeWalletAdapter());
        }
      } catch {}
    }
    return list;
  }, [version]);
  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

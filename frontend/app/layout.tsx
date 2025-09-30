
import '../styles/globals.css';
const enableEmbeddedIndexer = process.env.EMBEDDED_INDEXER === '1';
if (typeof window === 'undefined' && enableEmbeddedIndexer) {
  require('../utils/indexer');
}
import { ReactNode } from 'react';
import Link from 'next/link';
import { WalletWrapper } from '../components/wallet-wrapper';
import { Nav } from '../components/nav';
import { ToastProvider } from '../components/Toast';
import { NetworkBanner } from '../components/NetworkBanner';

export const metadata = {
  title: 'DopelgangaChain',
  description: "Solana's twin. Native token: DOPE.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`text-white bg-dopel-gradient min-h-screen min-h-dvh`}>
        <ToastProvider>
          <WalletWrapper>
            <Nav />
            <NetworkBanner />
            <div className="px-6 md:px-10">{children}</div>
            <footer className="py-6 md:py-10 text-center text-white/50 text-sm">
              © {new Date().getFullYear()} DopelgangaChain — Solana’s twin. Native token: DOPE •{' '}
              <Link href="/documents/validator" className="underline hover:text-white">Validator Docs</Link>{' '}•{' '}
              <Link href="/documents/staking" className="underline hover:text-white">Staking Docs</Link>
            </footer>
          </WalletWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}

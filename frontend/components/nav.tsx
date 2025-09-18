
'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useToast } from './Toast';

const WalletMultiButton = dynamic<any>(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export function Nav() {
  const { show } = useToast();
  const soonClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();
    show('Feature not live yet — coming soon');
  };
  return (
    <header className="sticky top-0 z-40 bg-[rgba(10,10,10,0.6)] backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="size-8 rounded-xl bg-dopel-500/20 border border-dopel-500/40 grid place-items-center transition-transform duration-300 hover:rotate-6 hover:scale-105">
            <Image src="/dopel.svg" alt="DopelgangaChain logo" width={18} height={18} className="pointer-events-none select-none" />
          </div>
          <span className="font-extrabold tracking-wide">DOPELGANGA CHAIN</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <a href="/#ecosystem" className="hover:text-white inline-flex items-center gap-1" onClick={soonClick}>
            Ecosystem
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Soon</span>
          </a>
          <Link href="/#roadmap" className="hover:text-white">Roadmap</Link>
          <Link href="/#network" className="hover:text-white">Network</Link>
          <a href="/#faucet" className="hover:text-white inline-flex items-center gap-1" onClick={soonClick}>
            Faucet
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Soon</span>
          </a>
          <Link href="/documents" className="hover:text-white">Docs</Link>
          <Link href="/pitchdeck" className="hover:text-white font-bold">Pitch Deck</Link>
        </nav>
        {/* Mobile nav buttons under Docs */}
        <nav className="flex md:hidden flex-col gap-2 absolute left-0 right-0 top-16 bg-[rgba(10,10,10,0.98)] px-4 py-3 border-b border-white/10 z-50">
          <Link href="/documents" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold">Docs</Link>
          <Link href="/pitchdeck" className="block w-full text-left py-2 px-3 rounded bg-dopel-500 text-white font-bold">Pitch Deck</Link>
        </nav>
        <div className="flex items-center gap-3">
          <WalletMultiButton className="!bg-dopel-500 hover:!bg-dopel-400" />
        </div>
      </div>
    </header>
  );
}

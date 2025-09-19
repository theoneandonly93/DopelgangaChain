
'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useToast } from './Toast';
import React, { useState } from 'react';

const WalletMultiButton = dynamic<any>(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export function Nav() {
  const { show } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-[rgba(10,10,10,0.6)] backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 relative">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="size-8 rounded-xl bg-dopel-500/20 border border-dopel-500/40 grid place-items-center transition-transform duration-300 hover:rotate-6 hover:scale-105">
            <Image src="/dopel.svg" alt="Dopelganga logo" width={18} height={18} className="pointer-events-none select-none" />
          </div>
          <span className="font-extrabold tracking-wide">DOPELGANGA</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/explorer" className="hover:text-white font-bold">Explorer</Link>
          <Link href="/airdrop" className="hover:text-white">Airdrop</Link>
          <Link href="/blocks" className="hover:text-white">Blocks</Link>
          <Link href="/launch-token" className="hover:text-white">Launch Token</Link>
          <Link href="/referral" className="hover:text-white">Referral</Link>
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/#roadmap" className="hover:text-white">Roadmap</Link>
          <Link href="/#network" className="hover:text-white">Network</Link>
          <Link href="/documents" className="hover:text-white">Docs</Link>
          <Link href="/pitchdeck" className="hover:text-white font-bold">Pitch Deck</Link>
        </nav>
        {/* Mobile menu toggle button (door icon) */}
        <button
          className="md:hidden ml-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-dopel-500"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {/* Door icon SVG */}
          {menuOpen ? (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-dopel-500">
              <rect x="5" y="4" width="14" height="16" rx="2" fill="currentColor" className="text-dopel-500/80" />
              <rect x="9" y="10" width="2" height="2" rx="1" fill="#fff" />
              <rect x="13" y="10" width="2" height="2" rx="1" fill="#fff" />
              <rect x="11" y="16" width="2" height="2" rx="1" fill="#fff" />
            </svg>
          ) : (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-dopel-500">
              <rect x="5" y="4" width="14" height="16" rx="2" fill="currentColor" className="text-dopel-500/80" />
              <rect x="11" y="16" width="2" height="2" rx="1" fill="#fff" />
            </svg>
          )}
        </button>
        {/* Collapsible mobile nav */}
        {menuOpen && (
          <nav className="flex md:hidden flex-col gap-2 absolute left-0 right-0 top-16 bg-[rgba(10,10,10,0.98)] px-4 py-3 border-b border-white/10 z-50 shadow-lg animate-fade-in">
            <Link href="/dashboard" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link href="/explorer" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-bold" onClick={() => setMenuOpen(false)}>Explorer</Link>
            <Link href="/airdrop" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Airdrop</Link>
            <Link href="/blocks" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Blocks</Link>
            <Link href="/launch-token" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Launch Token</Link>
            <Link href="/referral" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Referral</Link>
            <Link href="/documents" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Docs</Link>
            <Link href="/pitchdeck" className="block w-full text-left py-2 px-3 rounded bg-dopel-500 text-white font-bold" onClick={() => setMenuOpen(false)}>Pitch Deck</Link>
          </nav>
        )}
        <div className="flex items-center gap-3">
          <WalletMultiButton className="!bg-dopel-500 hover:!bg-dopel-400" />
        </div>
      </div>
    </header>
  );
}

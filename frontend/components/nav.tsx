
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
          <Link href="/validators" className="hover:text-white">Validators</Link>
          <Link href="/staking" className="hover:text-white">Staking</Link>
          <Link href="/airdrop" className="hover:text-white">Airdrop</Link>
          {/* <Link href="/blocks" className="hover:text-white">Blocks</Link> */}
          <Link href="/launch-token" className="hover:text-white">Launch Token</Link>
          <Link href="/referral" className="hover:text-white">Referral</Link>
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/#roadmap" className="hover:text-white">Roadmap</Link>
          <Link href="/#network" className="hover:text-white">Network</Link>
          <Link href="/documents" className="hover:text-white">Docs</Link>
          {/* <Link href="/pitchdeck" className="hover:text-white font-bold">Pitch Deck</Link> */}
        </nav>
        {/* Menu toggle (hamburger icon) */}
        <button
          className="ml-2 p-2 text-white/90 hover:text-white rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            // Close (X) icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            // Hamburger icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
        {/* Collapsible dropdown nav */}
        {menuOpen && (
          <nav className="flex flex-col gap-2 absolute left-0 right-0 top-16 bg-[rgba(10,10,10,0.98)] px-4 py-3 border-b border-white/10 z-50 shadow-lg animate-fade-in">
            <div className="mb-2 flex gap-2">
              <WalletMultiButton className="flex-1 !justify-center !bg-white !text-black !border !border-white/20 !rounded-lg !h-10 hover:!bg-white/90" />
              <Link href="/staking" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:border-white/40">Staking</Link>
            </div>
            <Link href="/dashboard" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link href="/explorer" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-bold" onClick={() => setMenuOpen(false)}>Explorer</Link>
            <Link href="/validators" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Validators</Link>
            <Link href="/staking" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Staking</Link>
            <Link href="/airdrop" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Airdrop</Link>
            {/* <Link href="/blocks" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Blocks</Link> */}
            <Link href="/launch-token" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Launch Token</Link>
            <Link href="/referral" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Referral</Link>
            <Link href="/documents" className="block w-full text-left py-2 px-3 rounded bg-white/10 text-white font-semibold" onClick={() => setMenuOpen(false)}>Docs</Link>
            {/* <Link href="/pitchdeck" className="block w-full text-left py-2 px-3 rounded bg-dopel-500 text-white font-bold" onClick={() => setMenuOpen(false)}>Pitch Deck</Link> */}
          </nav>
        )}
        {/* Wallet button moved into dropdown */}
      </div>
    </header>
  );
}

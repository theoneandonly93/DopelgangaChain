'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function NetworkBanner() {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('network-banner-dismissed') === '1';
    setHidden(dismissed);
  }, []);
  if (hidden) return null;
  const dismiss = () => {
    localStorage.setItem('network-banner-dismissed', '1');
    setHidden(true);
  };
  return (
    <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-2 text-sm flex items-center justify-between">
        <div className="text-white/80">
            Network in preparation — some features are coming soon. See <Link href="/documents/roadmap" className="underline hover:text-white">roadmap</Link>.
        </div>
        <button onClick={dismiss} className="text-white/60 hover:text-white">Dismiss</button>
      </div>
    </div>
  );
}

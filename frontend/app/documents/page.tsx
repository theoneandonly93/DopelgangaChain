import React, { useState } from 'react';
export default function DocumentsPage() {
  return (
    <div className="space-y-6 sm:space-y-10">
      <section id="introduction" className="glass rounded-2xl p-4 sm:p-6 border border-white/10">
        <h1 className="text-2xl sm:text-3xl font-extrabold">DopelgangaChain Documentation</h1>
        <p className="text-white/70 mt-2 text-base sm:text-lg">Solana’s twin. Native token: DOPE. Build with familiar Solana tooling and deploy to DopelgangaChain.</p>
      </section>

      <section id="quickstart" className="glass rounded-2xl p-4 sm:p-6 border border-white/10">
        <h2 className="text-xl sm:text-2xl font-bold">Quickstart</h2>
        <ol className="list-decimal pl-5 text-white/80 mt-2 space-y-1 text-sm sm:text-base">
          <li>Install Solana CLI and your wallet of choice.</li>
          <li>Point your RPC to <code>https://dopel-rpc.dopelganga.workers.dev</code>.</li>
          <li>Deploy your program or start interacting with DOPE-native dApps.</li>
        </ol>
      </section>

      <section id="network" className="glass rounded-2xl p-4 sm:p-6 border border-white/10">
        <h2 className="text-xl sm:text-2xl font-bold">Network & RPC</h2>
        <p className="text-white/80 mt-2 text-sm sm:text-base">Use our RPC endpoints to connect your apps and tooling.</p>
        <div className="mt-3 text-white/70 text-xs sm:text-base">
          <div>Mainnet RPC: <code>https://dopel-rpc.dopelganga.workers.dev</code></div>
          <div>Genesis Program: <code>HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP</code></div>
        </div>
      </section>

      {/* Roadmap, Wallets, Programs, Tokens, Nodes, Monitoring, FAQ sections removed until live info is available */}

    </div>
  );
}

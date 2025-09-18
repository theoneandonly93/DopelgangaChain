
import { Card } from '../components/Card';
import { CopyButton } from '../components/CopyButton';
import { ComingSoonButton } from '../components/ComingSoonButton';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto py-12">
  <section className="rounded-3xl border border-white/10 p-8 md:p-12 mb-12 glass text-center shadow-card">
        <div className="mx-auto mb-3 size-12 rounded-xl bg-dopel-500/15 border border-dopel-500/30 grid place-items-center transition-transform duration-300 hover:rotate-6 hover:scale-105">
          <Image src="/dopel.svg" alt="DopelgangaChain" width={28} height={28} className="pointer-events-none select-none" />
        </div>
        <div className="text-xs tracking-widest text-white/70">DOPELGANGACHAIN</div>
        <h1 className="mt-2 text-4xl md:text-6xl font-black tracking-tight leading-tight">
          SOLANA'S TWIN — BUILT FOR SPEED
        </h1>
        <p className="mt-4 text-white/80 max-w-2xl mx-auto">
          DopelgangaChain mirrors Solana’s battle-tested architecture with native token DOPEL. Same speed and security — your apps run on Solana’s twin.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="#network" className="px-5 py-2.5 rounded-xl bg-dopel-500 text-black font-bold hover:bg-dopel-400 shadow-card">Network Status</Link>
          <Link href="#faucet" className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/30 bg-white/10 font-semibold">Faucet</Link>
        </div>
      </section>

      <section id="network" className="grid md:grid-cols-4 gap-5 mb-12">
        <Card className="shadow-card text-center"><div className="text-2xl font-extrabold">65,000+</div><div className="text-white/60 text-sm">TPS</div></Card>
        <Card className="shadow-card text-center"><div className="text-2xl font-extrabold">400ms</div><div className="text-white/60 text-sm">Slot Time</div></Card>
        <Card className="shadow-card text-center"><div className="text-2xl font-extrabold">$0.00025</div><div className="text-white/60 text-sm">TX Cost</div></Card>
        <Card className="shadow-card text-center"><div className="text-2xl font-extrabold">99.9%</div><div className="text-white/60 text-sm">Uptime</div></Card>
      </section>

      <section id="rpc" className="glass rounded-3xl border border-white/5 p-6 md:p-8 mb-12">
  <h3 className="text-xl font-extrabold">RPC Information</h3>
  <p className="text-white/75 mt-2">Connect to the DopelgangaChain network</p>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="shadow-card text-left">
            <div className="text-xs text-white/60">RPC URL</div>
            <div className="font-mono mt-1 text-white/90 break-all overflow-x-auto whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-all'}}>
              https://dopelgangachain.dev
            </div>
            <div className="mt-3 flex gap-2">
              <CopyButton value="https://dopelgangachain.dev" label="Copy URL" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30" />
              <ComingSoonButton>Open Explorer</ComingSoonButton>
            </div>
          </Card>
          <Card className="shadow-card text-left">
            <div className="text-xs text-white/60">GENESIS PROGRAM</div>
            <div className="font-mono mt-1 break-all text-white/90">Co4692bPPQXAqqxSLAeTTvF1bnhY26FUWt2YuWQPBgfU</div>
            <div className="mt-3"><CopyButton value="Co4692bPPQXAqqxSLAeTTvF1bnhY26FUWt2YuWQPBgfU" label="Copy Address" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30" /></div>
          </Card>
        </div>
      </section>

      <section id="features" className="mb-12">
        <h3 className="text-2xl font-extrabold mb-4">Why DopelgangaChain?</h3>
        <div className="grid md:grid-cols-4 gap-5">
          <Card className="shadow-card"><h4 className="font-semibold">Lightning Fast</h4><p className="text-sm text-white/70 mt-2">Meme transactions at the speed of light with Solana compatibility</p></Card>
          <Card className="shadow-card"><h4 className="font-semibold">Secure & Reliable</h4><p className="text-sm text-white/70 mt-2">Built on Solana’s twin architecture with native DOPEL token</p></Card>
          <Card className="shadow-card"><h4 className="font-semibold">Community Driven</h4><p className="text-sm text-white/70 mt-2">Governed by the meme community for maximum banana potential</p></Card>
          <Card className="shadow-card"><h4 className="font-semibold">Developer Friendly</h4><p className="text-sm text-white/70 mt-2">Full Solana compatibility — deploy once, run on the twin</p></Card>
        </div>
      </section>

      <section id="ecosystem" className="mb-12">
        <h3 className="text-2xl font-bold mb-4 text-center">Ecosystem</h3>
        <div className="grid md:grid-cols-4 gap-5">
          <Card className="shadow-card text-center"><h4 className="font-semibold">DEX</h4><p className="text-sm text-white/70 mt-2">Coming soon</p></Card>
          <Card className="shadow-card text-center"><h4 className="font-semibold">Wallet</h4><p className="text-sm text-white/70 mt-2">Coming soon</p></Card>
          <Card className="shadow-card text-center"><h4 className="font-semibold">Bridge</h4><p className="text-sm text-white/70 mt-2">Coming soon</p></Card>
          <Card className="shadow-card text-center"><h4 className="font-semibold">Tools</h4><p className="text-sm text-white/70 mt-2">Coming soon</p></Card>
        </div>
      </section>

      <section id="roadmap" className="mb-12">
        <h3 className="text-2xl font-bold mb-4 text-center">Roadmap</h3>
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="shadow-card"><h4 className="font-semibold">Phase 1</h4><p className="text-sm text-white/70 mt-2">Mainnet launch, RPC endpoints, explorer</p></Card>
          <Card className="shadow-card"><h4 className="font-semibold">Phase 2</h4><p className="text-sm text-white/70 mt-2">Ecosystem growth, DOPEL integrations, tooling</p></Card>
          <Card className="shadow-card"><h4 className="font-semibold">Phase 3</h4><p className="text-sm text-white/70 mt-2">Cross-chain bridge, governance, scaling</p></Card>
        </div>
      </section>

      <section id="faucet" className="glass rounded-3xl border border-white/5 p-6 md:p-8 mb-12 text-center">
        <h3 className="text-2xl font-bold">Faucet</h3>
        <p className="text-white/70 mt-2">Get DOPEL test tokens to try the network</p>
        <div className="mt-4 flex justify-center gap-3">
          <ComingSoonButton>Request DOPEL</ComingSoonButton>
          <Link href="/documents" className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/30 bg-white/10">Read Docs</Link>
        </div>
      </section>

      <footer className="py-10 text-center text-white/50 text-sm">
        © {new Date().getFullYear()} DopelgangaChain — Solana’s twin. Native token: DOPEL
      </footer>
    </div>
  );
}

export default function Roadmap() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">Roadmap</h1>
        <div className="prose prose-invert mt-4">
          <p>DopelgangaChain is iterating fast. This is a living plan.</p>
          <h2>Phases</h2>
          <h3>Phase 0 — Preview</h3>
          <ul>
            <li>Docs scaffold and UI polish</li>
            <li>Wallet connect (UI) and placeholder flows</li>
            <li>Developer feedback loop open</li>
          </ul>
          <h3>Phase 1 — Devnet</h3>
          <ul>
            <li>Public RPC endpoint</li>
            <li>Faucet for DOPE test funds</li>
            <li>Explorer alpha and indexer (virtual blocks)</li>
          </ul>
          <h3>Phase 2 — Mainnet Beta</h3>
          <ul>
            <li>Program compatibility hardening (Anchor + Solana SDKs)</li>
            <li>Token launch workflows and docs</li>
            <li>Ecosystem integrations</li>
          </ul>
          <blockquote>Note: Timelines are indicative and may shift.</blockquote>
          <h2>Tracking</h2>
          <ul>
            <li>GitHub issues and project boards</li>
            <li>Docs updates tagged with version badges</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

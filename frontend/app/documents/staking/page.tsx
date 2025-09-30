import Link from 'next/link';

export default function StakingDocs() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">Staking $DOPE</h1>
        <p className="text-white/75 mt-2 text-sm">Stake $DOPE to participate as a validator. Choose a lock duration to boost rewards, or use the no‑lock tier for flexibility (no rewards).</p>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">1) Requirements</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>A wallet with $DOPE</li>
          <li>RPC set to <code>https://dopel-rpc.dopelganga.workers.dev</code></li>
          <li>Optional: Solana CLI for advanced flows</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">2) Stake in the app</h2>
        <ol className="list-decimal pl-5 text-white/80 mt-2 space-y-2 text-sm">
          <li>Open <Link className="underline" href="/staking">Staking</Link> and connect your wallet.</li>
          <li>Enter the amount of $DOPE to stake.</li>
          <li>Select a lock duration:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>No Lock: instant unstake, no rewards</li>
              <li>7 days: 1.0× rewards</li>
              <li>30 days: 1.2× rewards</li>
              <li>90 days: 1.5× rewards</li>
            </ul>
          </li>
          <li>Click Stake and approve the transaction.</li>
        </ol>
        <p className="text-white/70 text-xs mt-3">Note: Unstaking a locked position becomes available once the lock ends (cool‑down may apply). No‑lock can be unstaked anytime.</p>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">3) Rewards</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>Rewards accrue continuously and are based on effective stake (amount × lock multiplier) and validator activity.</li>
          <li>Claim rewards in‑app from the <Link className="underline" href="/validators">Validators</Link> page.</li>
          <li>APR and emissions are governed; final parameters will be published in <Link className="underline" href="/documents/tokenomics">Token Strategy</Link>.</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">4) Advanced (CLI)</h2>
        <p className="text-white/75 text-sm">Developers can stake via CLI using the public IDL once published.</p>
        <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`# Set environment
RPC_URL=https://dopel-rpc.dopelganga.workers.dev
PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID
DOP_MINT=$NEXT_PUBLIC_DOP_MINT
IDL_URL=https://www.dopelganga.com/idl/dopelgangachain.json

# Then use your Anchor client to call stake_dopel(amount, lock_tier)
# (Exact method signature will be confirmed with the IDL release)`}</pre>
      </section>
    </div>
  );
}


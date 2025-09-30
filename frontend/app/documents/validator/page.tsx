import Link from 'next/link';

export default function ValidatorDocs() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">Dopelganga Validator Docs</h1>
        <p className="text-white/75 mt-2 text-sm">
          Run a validator on DopelgangaChain and earn $DOPE. These steps mirror Solana with Dopel-specific RPC and reward flow.
        </p>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">1) Prerequisites</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>Linux host or VM with stable network and SSD storage</li>
          <li>Node.js 20+ for helper scripts (optional)</li>
          <li>Solana CLI installed</li>
        </ul>
        <pre className="mt-3 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`}</pre>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">2) Configure RPC</h2>
        <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`solana config set --url https://dopel-rpc.dopelganga.workers.dev`}</pre>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">3) Create Identity & $DOPE Account</h2>
        <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`solana-keygen new -o ~/validator-keypair.json
solana address -k ~/validator-keypair.json
export DOP_MINT=$NEXT_PUBLIC_DOP_MINT
export VALIDATOR_PUBKEY=$(solana address -k ~/validator-keypair.json)
spl-token create-account $DOP_MINT --owner $VALIDATOR_PUBKEY`}</pre>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">4) Start the Validator</h2>
        <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`solana-validator \
  --identity ~/validator-keypair.json \
  --ledger ~/dopel-ledger \
  --rpc-port 8899 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --dynamic-port-range 8000-8010 \
  --full-rpc-api \
  --limit-ledger-size`}</pre>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">5) Claim Rewards</h2>
        <p className="text-white/75 text-sm">Use the in‑app Validators page to claim with your connected wallet. For CLI users, use any Anchor client with the program ID and the public IDL (published soon).</p>
        <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`# Wallet: App → Validators → Connect → Claim

# CLI (advanced)
RPC_URL=https://dopel-rpc.dopelganga.workers.dev \
PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID \
DOP_MINT=$NEXT_PUBLIC_DOP_MINT \
IDL_URL=https://www.dopelganga.com/idl/dopelgangachain.json
# (Use your Anchor/Node client to call mintValidatorReward)`}</pre>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">See Also</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30" href="/documents/quickstart">Quickstart</Link>
          <Link className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30" href="/validators">Validators Leaderboard</Link>
        </div>
      </section>
    </div>
  );
}

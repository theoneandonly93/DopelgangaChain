export default function Quickstart() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">Run a DopelgangaChain Validator</h1>
        <ol className="list-decimal pl-5 text-white/80 mt-2 space-y-2 text-sm">
          <li>
            Install Solana CLI
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`}</pre>
          </li>
          <li>
            Set RPC
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`solana config set --url https://dopel-rpc.dopelganga.workers.dev`}</pre>
          </li>
          <li>
            Create identity & $DOPE account
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`solana-keygen new -o ~/validator-keypair.json
solana address -k ~/validator-keypair.json
export DOP_MINT=$NEXT_PUBLIC_DOP_MINT
export VALIDATOR_PUBKEY=$(solana address -k ~/validator-keypair.json)
spl-token create-account $DOP_MINT --owner $VALIDATOR_PUBKEY`}</pre>
          </li>
          <li>
            Start validator
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`solana-validator \
  --identity ~/validator-keypair.json \
  --ledger ~/dopel-ledger \
  --rpc-port 8899 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --dynamic-port-range 8000-8010 \
  --full-rpc-api \
  --limit-ledger-size`}</pre>
          </li>
          <li>
            Claim a reward
            <div className="mt-2 text-white/75 text-xs">Use the in‑app Validators page to claim with your connected wallet. For CLI users, use any Anchor client with the program ID and IDL (published soon).</div>
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">{`# Wallet flow: App → Validators → Connect → Claim

# CLI flow (advanced)
RPC_URL=https://dopel-rpc.dopelganga.workers.dev \
PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID \
DOP_MINT=$NEXT_PUBLIC_DOP_MINT \
IDL_URL=https://www.dopelganga.com/idl/dopelgangachain.json
# (Run your own Anchor/Node client with these values)`}</pre>
          </li>
        </ol>
        <p className="text-white/70 text-xs mt-3">Request to be added to the validator set via governance before claiming rewards.</p>
      </section>
    </div>
  );
}

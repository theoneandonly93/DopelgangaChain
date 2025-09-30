"use client";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import useSWR from "swr";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { SITE } from "@/utils/site";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const dopMintStr = process.env.NEXT_PUBLIC_DOP_MINT || "";
  const dopMint = useMemo(() => (dopMintStr ? new PublicKey(dopMintStr) : null), [dopMintStr]);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [dopeBalance, setDopeBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balances when wallet connects
  useEffect(() => {
    const run = async () => {
      if (!publicKey) { setSolBalance(null); setDopeBalance(null); return; }
      setLoading(true); setError(null);
      try {
        // SOL balance
        const lamports = await connection.getBalance(publicKey, { commitment: "confirmed" });
        setSolBalance(lamports / 1e9);
        // DOPE balance
        if (dopMint) {
          try {
            const ata = await getAssociatedTokenAddress(dopMint, publicKey);
            const bal = await connection.getTokenAccountBalance(ata).catch(() => null);
            setDopeBalance(bal ? Number(bal.value.uiAmount || 0) : 0);
          } catch (_) {
            setDopeBalance(0);
          }
        } else {
          setDopeBalance(null);
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [publicKey, connection, dopMint]);

  // Recent DOPE transactions for this address via API
  const { data: addrActivity } = useSWR(
    publicKey ? `/api/address/${publicKey.toBase58()}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // Rewards data
  const { data: recentRewards } = useSWR(
    `/api/rewards/recent`,
    fetcher,
    { refreshInterval: 5000 }
  );
  const { data: leaderboard } = useSWR(
    `/api/rewards/leaderboard`,
    fetcher,
    { refreshInterval: 10000 }
  );

  return (
    <div className="min-h-screen text-white p-6">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Wallet Dashboard</h1>

        {!publicKey && (
          <div className="glass rounded-xl p-5 border border-white/10 mb-8">
            <div className="text-white/80">Connect your wallet to view balances and activity.</div>
          </div>
        )}

        {publicKey && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/60 mb-1">Wallet</div>
              <div className="font-mono break-all">{publicKey.toBase58()}</div>
              <div className="mt-3"><CopyButton value={publicKey.toBase58()} label="Copy Address" className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-white/30" /></div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <div className="text-xs text-white/60">SOL Balance</div>
              <div className="text-2xl font-extrabold mt-1">{solBalance !== null ? solBalance.toFixed(4) : (loading ? '—' : '0.0000')} SOL</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <div className="text-xs text-white/60">$DOPE Balance</div>
              <div className="text-2xl font-extrabold mt-1">{dopeBalance !== null ? dopeBalance.toFixed(4) : (loading ? '—' : '0.0000')} DOPE</div>
            </div>
          </section>
        )}

        {error && (
          <div className="mb-6 text-red-400">Error: {error}</div>
        )}

        {/* Recent Activity */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Recent $DOPE Activity</h2>
            {publicKey && <Link className="text-sm underline text-white/80 hover:text-white" href={`/address/${publicKey.toBase58()}`}>View all</Link>}
          </div>
          <div className="glass rounded-xl p-0 overflow-x-auto border border-white/10">
            <table className="table-scan text-sm min-w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Signature</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {(!addrActivity || !Array.isArray(addrActivity.txs)) && (
                  <tr><td colSpan={4} className="px-3 py-3">{publicKey ? 'Loading...' : 'Connect wallet'}</td></tr>
                )}
                {Array.isArray(addrActivity?.txs) && addrActivity.txs.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-3 text-white/60">No recent activity</td></tr>
                )}
                {Array.isArray(addrActivity?.txs) && addrActivity.txs.length > 0 && (
                  addrActivity.txs.map((tx: any, i: number) => (
                    <tr key={i} className="row-hover">
                      <td className="px-3 py-2 font-mono break-all">{tx.signature}</td>
                      <td className="px-3 py-2">{tx.type}</td>
                      <td className="px-3 py-2">{(Number(tx.amount)/1e9).toFixed(4)} DOPE</td>
                      <td className="px-3 py-2">{new Date(tx.time).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Helpful links */}
        <section className="mb-8">
          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="text-sm text-white/80">Useful pages</div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30" href="/explorer">Explorer</Link>
              <Link className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30" href="/launch-token">Launch Token</Link>
              <Link className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30" href="/referral">Referral</Link>
            </div>
          </div>
        </section>

        {/* Validator Tools: Encourage users to run a validator */}
        <section className="mb-8">
          <div className="glass rounded-xl p-4 md:p-6 border border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold">Become a Validator</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">New</span>
            </div>
            <p className="text-white/75 mt-2 text-sm">
              Anyone can help secure DopelgangaChain and earn $DOPE. It takes minutes to get started. Follow these steps on a server or your machine.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">1) Set RPC</div>
                <pre className="text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">
{`solana config set --url ${SITE.rpc.http}`}
                </pre>
                <CopyButton value={`solana config set --url ${SITE.rpc.http}`} className="mt-2 px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm" label="Copy" />
              </div>
              <div className="glass rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">2) Create identity</div>
                <pre className="text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">
{`solana-keygen new -o ~/validator-keypair.json
solana address -k ~/validator-keypair.json`}
                </pre>
                <CopyButton value={`solana-keygen new -o ~/validator-keypair.json
solana address -k ~/validator-keypair.json`} className="mt-2 px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm" label="Copy" />
              </div>
              <div className="glass rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">3) Create your $DOPE account</div>
                <pre className="text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">
{`export DOP_MINT=${process.env.NEXT_PUBLIC_DOP_MINT || ''}
export VALIDATOR_PUBKEY=$(solana address -k ~/validator-keypair.json)
spl-token create-account $DOP_MINT --owner $VALIDATOR_PUBKEY`}
                </pre>
                <CopyButton value={`export DOP_MINT=${process.env.NEXT_PUBLIC_DOP_MINT || ''}
export VALIDATOR_PUBKEY=$(solana address -k ~/validator-keypair.json)
spl-token create-account $DOP_MINT --owner $VALIDATOR_PUBKEY`} className="mt-2 px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm" label="Copy" />
              </div>
              <div className="glass rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">4) Start the validator</div>
                <pre className="text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto">
{`solana-validator \
  --identity ~/validator-keypair.json \
  --ledger ~/dopel-ledger \
  --rpc-port 8899 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --dynamic-port-range 8000-8010 \
  --full-rpc-api \
  --limit-ledger-size`}
                </pre>
                <CopyButton value={`solana-validator \
  --identity ~/validator-keypair.json \
  --ledger ~/dopel-ledger \
  --rpc-port 8899 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --dynamic-port-range 8000-8010 \
  --full-rpc-api \
  --limit-ledger-size`} className="mt-2 px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm" label="Copy" />
              </div>
            </div>
            <div className="mt-4 text-xs text-white/70">
              Tip: After you’re running, request to be added to the validator set via governance, then claim block rewards with our script.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/documents/quickstart" className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm">Read Quickstart</Link>
              <a href="https://docs.solana.com/running-validator/validator-start" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm">Solana Validator Docs</a>
            </div>
          </div>
        </section>

        {/* Claim Reward helper */}
        <section className="mb-8">
          <div className="glass rounded-xl p-4 md:p-6 border border-white/10">
            <h3 className="text-lg font-bold">Claim a Block Reward</h3>
            <p className="text-white/75 mt-2 text-sm">Run this from your machine (needs Node 18+, ts-node). It mints one validator reward to your $DOPE account.</p>
            <pre className="text-xs bg-black/30 p-3 rounded border border-white/10 overflow-x-auto mt-3">
{`cd frontend
RPC_URL=${SITE.rpc.http}
PROGRAM_ID=${process.env.NEXT_PUBLIC_PROGRAM_ID || ''}
DOP_MINT=${process.env.NEXT_PUBLIC_DOP_MINT || ''}
ANCHOR_WALLET=/path/to/your/id.json \
npx ts-node scripts/mintReward.ts`}
            </pre>
            <CopyButton
              value={`cd frontend\nRPC_URL=${SITE.rpc.http}\nPROGRAM_ID=${process.env.NEXT_PUBLIC_PROGRAM_ID || ''}\nDOP_MINT=${process.env.NEXT_PUBLIC_DOP_MINT || ''}\nANCHOR_WALLET=/path/to/your/id.json \\\nnpx ts-node scripts/mintReward.ts`}
              className="mt-2 px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30 text-sm"
              label="Copy"
            />
            <div className="text-xs text-white/60 mt-2">Tip: Make sure your validator is added to the validator set via governance first.</div>
          </div>
        </section>

        {/* Rewards widgets */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Recent Validator Rewards</h3>
              <span className="text-xs text-white/60">{Array.isArray(recentRewards) ? recentRewards.length : 0}</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="table-scan text-sm min-w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Block</th>
                    <th className="px-3 py-2 text-left">Validator</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {!Array.isArray(recentRewards) && (
                    <tr><td className="px-3 py-2" colSpan={4}>Loading…</td></tr>
                  )}
                  {Array.isArray(recentRewards) && recentRewards.length === 0 && (
                    <tr><td className="px-3 py-2 text-white/60" colSpan={4}>No rewards yet</td></tr>
                  )}
                  {Array.isArray(recentRewards) && recentRewards.map((r: any) => (
                    <tr key={r.id} className="row-hover">
                      <td className="px-3 py-2">{r.block}</td>
                      <td className="px-3 py-2 font-mono break-all">{r.validator}</td>
                      <td className="px-3 py-2">{(Number(r.amount)/1e9).toFixed(4)} DOPE</td>
                      <td className="px-3 py-2">{new Date(Number(r.timestamp)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10">
            <h3 className="text-lg font-bold">Top Validators</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="table-scan text-sm min-w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Validator</th>
                    <th className="px-3 py-2 text-left">Total Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  {!Array.isArray(leaderboard) && (
                    <tr><td className="px-3 py-2" colSpan={2}>Loading…</td></tr>
                  )}
                  {Array.isArray(leaderboard) && leaderboard.length === 0 && (
                    <tr><td className="px-3 py-2 text-white/60" colSpan={2}>No data</td></tr>
                  )}
                  {Array.isArray(leaderboard) && leaderboard.map((row: any, i: number) => (
                    <tr key={i} className="row-hover">
                      <td className="px-3 py-2 font-mono break-all">{row.validator}</td>
                      <td className="px-3 py-2">{(Number(row.total_rewards)/1e9).toFixed(4)} DOPE</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

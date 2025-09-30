"use client";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import useSWR from "swr";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";

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
      </main>
    </div>
  );
}

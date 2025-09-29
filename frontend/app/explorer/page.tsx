"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/Card";


const fetcher = (url: string) => fetch(url).then((r) => r.json());


export default function Explorer() {
  const [search, setSearch] = useState("");
  const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL || "";
  const { data: blocks, error: blocksError } = useSWR(
    `/api/blocks?limit=20`,
    fetcher,
    { refreshInterval: 5000 }
  );
  const { data: stats, error: statsError } = useSWR(
    "/api/stats",
    fetcher,
    { refreshInterval: 5000 }
  );
  const { data: txs, error: txsError } = useSWR(
    "/api/transactions",
    fetcher,
    { refreshInterval: 5000 }
  );
  const { data: health } = useSWR(
    indexerUrl ? `${indexerUrl}/health` : null,
    fetcher,
    { refreshInterval: 5000 }
  );
  const { data: rewards, error: rewardsError } = useSWR(
    "/api/rewards/recent",
    fetcher,
    { refreshInterval: 5000 }
  );

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Future: route to block/tx/address pages based on input
  };

  return (
    <div className="min-h-screen text-white">
      <main className="max-w-6xl mx-auto text-left px-4 md:px-6">
        {/* Hero */}
        <section className="scan-hero rounded-3xl mt-6 p-5 md:p-8 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Explore Dopelganga<br className="hidden md:block"/> Blockchain</h1>
              <form onSubmit={onSearch} role="search" className="mt-5">
                <div className="scan-search flex items-center gap-2">
                  <input
                    aria-label="Search transactions, blocks, programs or addresses"
                    className="scan-search-input"
                    placeholder="Search transactions, blocks, programs or addresses"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button type="submit" className="scan-search-btn" aria-label="Search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
                </div>
              </form>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="size-10 grid place-items-center rounded-xl bg-white/25 text-white/90">⟠</div>
              <div className="size-10 grid place-items-center rounded-xl bg-white/25 text-white/90">☼</div>
              <div className="size-10 grid place-items-center rounded-xl bg-white/25 text-white/90">≡</div>
            </div>
          </div>
          {/* Sponsored/metrics style row */}
          <div className="mt-4 text-sm flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 pill">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              TPS {stats?.tps ?? '—'}
            </span>
            <span className="inline-flex items-center gap-2 pill">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Block #{stats?.blockHeight ?? 0}
            </span>
            <span className="inline-flex items-center gap-2 pill">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
              Rewards/Block {stats?.rewardPerBlock ? (Number(stats.rewardPerBlock)/1e9).toFixed(4) : 0} DOP
            </span>
            <span className="inline-flex items-center gap-2 pill">
              <span className="w-2 h-2 rounded-full bg-lime-400"></span>
              Supply {typeof stats?.dopelSupply === 'number' ? stats.dopelSupply.toLocaleString() : '—'}
            </span>
          </div>
        </section>

        {/* Health banner (shows if indexer in memory mode or not fully ready) */}
        {health && (
          (!health.dbEnabled || !health.rpcOk || !health.subscribed) && (
            <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 p-3">
              <div className="font-semibold mb-1">Indexer Notice</div>
              {!health.dbEnabled && <div>- Running in memory mode (DB disabled). Data will not persist.</div>}
              {!health.rpcOk && <div>- RPC not reachable.</div>}
              {!health.subscribed && <div>- Log subscription not active yet.</div>}
            </div>
          )
        )}

        {/* Live stats */}
        <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {statsError && <div className="col-span-4 text-red-500">Failed to load stats</div>}
          {!stats && !statsError && <div className="col-span-4">Loading stats...</div>}
          {stats && <>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-lg font-bold">{stats.tps}</div>
              <div className="text-xs text-white/60">TPS</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-lg font-bold">{stats.blockHeight}</div>
              <div className="text-xs text-white/60">Block Height</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-lg font-bold">{typeof stats.dopelSupply === 'number' ? stats.dopelSupply.toLocaleString() : 0}</div>
              <div className="text-xs text-white/60">Dopel Supply</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-lg font-bold">Epoch {stats.epoch}</div>
              <div className="text-xs text-white/60">Epoch</div>
            </div>
          </>}
        </section>

        {/* Blocks + Transactions in two-column layout like Solscan */}
        <section className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Latest Blocks</h2>
              <div className="hidden sm:flex gap-2 overflow-x-auto">
                <span className="pill pill-active"># Blocks</span>
              </div>
            </div>
            <table className="table-scan text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Block</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Events</th>
                </tr>
              </thead>
              <tbody>
                {blocksError && (
                  <tr>
                    <td colSpan={3} className="text-red-500 px-3 py-2">Failed to load blocks</td>
                  </tr>
                )}
                {!blocks && !blocksError && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2">Loading...</td>
                  </tr>
                )}
                {Array.isArray(blocks) && blocks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-center text-white/60">No blocks yet</td>
                  </tr>
                )}
                {Array.isArray(blocks) && blocks.length > 0 &&
                  blocks.map((block: any) => (
                    <tr key={block.blockNumber} className="row-hover cursor-pointer">
                      <td className="px-3 py-2 font-mono">
                        <Link href={`/blocks/${block.blockNumber}`}>
                          #{block.blockNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2">{block.events?.length ?? 0}</td>
                    </tr>
                  ))}
                {blocks && !Array.isArray(blocks) && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-red-500">Invalid block data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Latest Transactions</h2>
            </div>
            <table className="table-scan text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Signature</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {txsError && (
                  <tr>
                    <td colSpan={4} className="text-red-500 px-3 py-2">Failed to load transactions</td>
                  </tr>
                )}
                {!txs && !txsError && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2">Loading...</td>
                  </tr>
                )}
                {Array.isArray(txs) && txs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-white/60">No activity yet</td>
                  </tr>
                )}
                {Array.isArray(txs) && txs.length > 0 && txs.map((tx: any, i: number) => (
                  <tr key={i} className="row-hover">
                    <td className="px-3 py-2 font-mono">{tx.signature}</td>
                    <td className="px-3 py-2">{tx.type}</td>
                    <td className="px-3 py-2">{tx.amount}</td>
                    <td className="px-3 py-2">{new Date(tx.time).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {txs && !Array.isArray(txs) && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-red-500">Invalid transaction data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </section>

        {/* Validator Rewards */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Validator Rewards</h2>
          <div className="overflow-x-auto">
            <table className="table-scan text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Block</th>
                  <th className="px-3 py-2 text-left">Validator</th>
                  <th className="px-3 py-2 text-left">Reward</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {rewardsError && (
                  <tr>
                    <td colSpan={4} className="text-red-500 px-3 py-2">Failed to load rewards</td>
                  </tr>
                )}
                {!rewards && !rewardsError && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2">Loading...</td>
                  </tr>
                )}
                {Array.isArray(rewards) && rewards.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-white/60">No rewards yet</td>
                  </tr>
                )}
                {Array.isArray(rewards) && rewards.length > 0 && rewards.map((r: any) => (
                  <tr key={r.id} className="row-hover">
                    <td className="px-3 py-2 font-mono">#{r.block}</td>
                    <td className="px-3 py-2">{r.validator}</td>
                    <td className="px-3 py-2">{Number(r.amount) / 1e9} DOP</td>
                    <td className="px-3 py-2">{new Date(Number(r.timestamp) * 1000).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

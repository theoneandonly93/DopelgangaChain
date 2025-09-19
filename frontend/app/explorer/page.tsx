"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";


const fetcher = (url: string) => fetch(url).then((r) => r.json());


export default function Explorer() {
  const [search, setSearch] = useState("");
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <main className="max-w-6xl mx-auto text-left">
        <h1 className="text-4xl font-bold mb-4">DopelgangaChain Explorer</h1>

        {/* Search bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <input
            className="w-full md:w-96 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none"
            placeholder="Search blocks / txs / addresses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Live stats */}
        <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Recent Blocks */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Recent Blocks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-white/60 border-b border-white/10">
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
                    <tr
                      key={block.blockNumber}
                      className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                    >
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
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-white/60 border-b border-white/10">
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
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
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
          </div>
        </section>
      </main>
    </div>
  );
}

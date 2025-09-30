"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AddressPage() {
  const { addr } = useParams();
  const { data, error } = useSWR(`/api/address/${addr}`, fetcher);

  if (error) return <div className="text-red-500 p-4">Failed to load address.</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-bold break-all">Address {String(addr)}</h1>
      <div className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="table-scan text-sm min-w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Signature</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">From</th>
                <th className="px-3 py-2 text-left">To</th>
                <th className="px-3 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data?.txs) && data.txs.length > 0 ? (
                data.txs.map((tx: any, i: number) => (
                  <tr key={i} className="row-hover">
                    <td className="px-3 py-2 font-mono break-all">{tx.signature}</td>
                    <td className="px-3 py-2">{tx.type}</td>
                    <td className="px-3 py-2">{tx.amount}</td>
                    <td className="px-3 py-2 break-all">{tx.from || '—'}</td>
                    <td className="px-3 py-2 break-all">{tx.to || '—'}</td>
                    <td className="px-3 py-2">{new Date(tx.time).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-white/60">No recent activity</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TxPage() {
  const { sig } = useParams();
  const { data, error } = useSWR(`/api/tx/${sig}`, fetcher);

  if (error) return <div className="text-red-500 p-4">Failed to load transaction.</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  // If API returned an array (derived events under same parent sig)
  if (Array.isArray(data)) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <h1 className="text-2xl font-bold">Transaction Events</h1>
        {data.map((tx: any, i: number) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="text-sm text-white/60">Signature</div>
            <div className="font-mono break-all">{tx.signature}</div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div><span className="text-white/60">Type:</span> {tx.type}</div>
              <div><span className="text-white/60">Amount:</span> {tx.amount}</div>
              <div><span className="text-white/60">From:</span> {tx.from || '—'}</div>
              <div><span className="text-white/60">To:</span> {tx.to || '—'}</div>
              <div className="col-span-2"><span className="text-white/60">Time:</span> {new Date(tx.time).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single tx
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-bold">Transaction</h1>
      <div className="glass rounded-xl p-4">
        <div className="text-sm text-white/60">Signature</div>
        <div className="font-mono break-all">{data.signature}</div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          <div><span className="text-white/60">Type:</span> {data.type}</div>
          <div><span className="text-white/60">Amount:</span> {data.amount}</div>
          <div><span className="text-white/60">From:</span> {data.from || '—'}</div>
          <div><span className="text-white/60">To:</span> {data.to || '—'}</div>
          <div className="col-span-2"><span className="text-white/60">Time:</span> {new Date(data.time).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}


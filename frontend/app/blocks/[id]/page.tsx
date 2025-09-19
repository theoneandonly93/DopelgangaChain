"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function BlockPage() {
  const { id } = useParams();
  const { data, error } = useSWR(`/api/blocks/${id}`, fetcher);

  if (error) return <div className="text-red-500">Failed to load block.</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">Block #{data.blockNumber}</h1>
      <p className="text-sm text-white/70">Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
      <div className="space-y-2">
        {data.events.map((tx: any, i: number) => (
          <div key={i} className="glass rounded-lg p-3">
            <p><b>Type:</b> {tx.type}</p>
            <p><b>From:</b> {tx.from}</p>
            <p><b>To:</b> {tx.to}</p>
            <p><b>Amount:</b> {tx.amount}</p>
            {tx.signature && (
              <p><b>Tx Signature:</b> <a href={`https://solscan.io/tx/${tx.signature}`} className="underline text-dopel-500" target="_blank" rel="noopener noreferrer">{tx.signature.slice(0, 12)}...</a></p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

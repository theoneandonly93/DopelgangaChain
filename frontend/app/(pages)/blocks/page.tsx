
'use client';
import useSWR from 'swr';
import { Card } from '@/components/Card';
const fetcher = (url: string) => fetch(url).then(r => r.json());
export default function BlocksPage() {
  const { data } = useSWR('/api/mock-blocks', fetcher, { refreshInterval: 3000 });
  return (
    <div className="max-w-6xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">Dopel Blocks</h1>
      {(data?.blocks ?? []).map((b: any) => (
        <Card key={b.blockNumber}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80">Block #{b.blockNumber}</div>
              <div className="text-xs text-white/60">{new Date(b.timestamp).toLocaleString()}</div>
            </div>
            <div className="text-sm text-white/80">{b.events.length} tx</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

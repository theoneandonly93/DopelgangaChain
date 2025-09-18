
'use client';
import { useState } from 'react';
import { Card } from '@/components/Card';
export default function Airdrop() {
  const [amount, setAmount] = useState(100);
  return (
    <div className="max-w-6xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">Dopel Airdrop</h1>
      <Card className="space-y-3">
        <div><label className="text-sm text-white/70">Amount</label><input type="number" className="w-full mt-1 glass rounded-lg px-3 py-2" value={amount} onChange={e=>setAmount(parseInt(e.target.value||'0'))} /></div>
        <button className="px-4 py-2 rounded-xl bg-dopel-500 text-black font-semibold hover:bg-dopel-400">Request Airdrop</button>
      </Card>
    </div>
  );
}

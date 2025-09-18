
'use client';
import { useState } from 'react';
import { Card } from '@/components/Card';
export default function LaunchToken() {
  const [name, setName] = useState('MyToken');
  const [symbol, setSymbol] = useState('MTK');
  const [supply, setSupply] = useState(1000000);
  const [fees, setFees] = useState(true);
  return (
    <div className="max-w-6xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">Launch Token</h1>
      <Card className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div><label className="text-sm text-white/70">Name</label><input className="w-full mt-1 glass rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div><label className="text-sm text-white/70">Symbol</label><input className="w-full mt-1 glass rounded-lg px-3 py-2" value={symbol} onChange={e=>setSymbol(e.target.value)} /></div>
          <div><label className="text-sm text-white/70">Supply</label><input type="number" className="w-full mt-1 glass rounded-lg px-3 py-2" value={supply} onChange={e=>setSupply(parseInt(e.target.value||'0'))} /></div>
        </div>
        <div className="flex items-center gap-2">
          <input id="fees" type="checkbox" className="accent-dopel-500" checked={fees} onChange={e=>setFees(e.target.checked)} />
          <label htmlFor="fees" className="text-sm text-white/80">Enable fee split (4% community, 2% dev, 2% liquidity)</label>
        </div>
        <button className="px-4 py-2 rounded-xl bg-dopel-500 text-black font-semibold hover:bg-dopel-400">Launch</button>
      </Card>
    </div>
  );
}

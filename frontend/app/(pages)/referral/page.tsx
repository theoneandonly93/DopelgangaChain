
'use client';
import { useState } from 'react';
import { Card } from '@/components/Card';
export default function Referral() {
  const [code, setCode] = useState('');
  return (
    <div className="max-w-6xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">Referral</h1>
      <Card className="space-y-3">
        <div><label className="text-sm text-white/70">Referral Code</label><input className="w-full mt-1 glass rounded-lg px-3 py-2" value={code} onChange={e=>setCode(e.target.value)} /></div>
        <button className="px-4 py-2 rounded-xl bg-dopel-500 text-black font-semibold hover:bg-dopel-400">Apply Code</button>
      </Card>
    </div>
  );
}

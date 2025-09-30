"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NetworkStats() {
  const { data: stats } = useSWR('/api/stats', fetcher, { refreshInterval: 5000 });
  const tps = typeof stats?.tps === 'number' && stats.tps > 0 ? stats.tps : '—';
  const height = typeof stats?.blockHeight === 'number' && stats.blockHeight > 0 ? stats.blockHeight : '—';
  const supply = typeof stats?.dopelSupply === 'number' && stats.dopelSupply > 0 ? stats.dopelSupply.toLocaleString() : '—';
  return (
    <section id="network" className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
      <div className="glass shadow-card text-center rounded-xl p-4"><div className="text-2xl font-extrabold">{tps}</div><div className="text-white/60 text-sm">TPS</div></div>
      <div className="glass shadow-card text-center rounded-xl p-4"><div className="text-2xl font-extrabold">{height}</div><div className="text-white/60 text-sm">Block Height</div></div>
      <div className="glass shadow-card text-center rounded-xl p-4"><div className="text-2xl font-extrabold">{supply}</div><div className="text-white/60 text-sm">$DOPE Supply</div></div>
      <div className="glass shadow-card text-center rounded-xl p-4 hidden md:block"><div className="text-2xl font-extrabold">99.9%</div><div className="text-white/60 text-sm">Uptime</div></div>
    </section>
  );
}


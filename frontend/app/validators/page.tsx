"use client";
import useSWR from 'swr';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import { CopyButton } from '@/components/CopyButton';
import { SITE } from '@/utils/site';

const WalletMultiButton = dynamic<any>(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ValidatorsPage() {
  const { publicKey } = useWallet();
  const self = publicKey?.toBase58();
  const { data } = useSWR('/api/validators', fetcher, { refreshInterval: 10000 });

  const validators = Array.isArray(data?.validators) ? data.validators : [];
  const count = Number(data?.count || validators.length || 0);

  return (
    <div className="min-h-screen text-white p-6">
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">Validators</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">Total: {count}</span>
            <WalletMultiButton className="!bg-white !text-black !border !border-white/20 !rounded-lg !h-9 hover:!bg-white/90" />
          </div>
        </div>

        <p className="text-white/75 text-sm mb-4">
          Help secure DopelgangaChain by running a validator. Rewards are paid in $DOPE. New? See the{' '}
          <Link className="underline" href="/documents/quickstart">Quickstart</Link>.
        </p>

        <div className="glass rounded-xl p-0 border border-white/10 overflow-x-auto">
          <table className="table-scan text-sm min-w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Validator</th>
                <th className="px-3 py-2 text-left">Active</th>
                <th className="px-3 py-2 text-left">Uptime</th>
                <th className="px-3 py-2 text-left">Commission</th>
                <th className="px-3 py-2 text-left">Staked</th>
                <th className="px-3 py-2 text-left">Total Rewards</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {validators.length === 0 && (
                <tr>
                  <td className="px-3 py-3" colSpan={7}>No validators yet</td>
                </tr>
              )}
              {validators.map((v: any) => {
                const isSelf = self && v.validator === self;
                const active = !!v.active;
                const uptime = Number(v.participation || 0);
                const totalRewardsDope = (Number(v.totalRewards || 0) / 1e9).toFixed(4);
                return (
                  <tr key={v.validator} className="row-hover">
                    <td className="px-3 py-2 font-mono break-all">
                      {v.validator}
                      {isSelf ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 align-middle">You</span> : null}
                    </td>
                    <td className="px-3 py-2">
                      {active ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white/70">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-white/10 rounded">
                          <div className="h-2 bg-lime-400 rounded" style={{ width: `${Math.min(100, Math.max(0, uptime))}%` }} />
                        </div>
                        <span className="tabular-nums">{uptime}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-white/60">—</td>
                    <td className="px-3 py-2 text-white/60">—</td>
                    <td className="px-3 py-2">{totalRewardsDope} DOPE</td>
                    <td className="px-3 py-2">
                      {isSelf ? (
                        <CopyButton
                          value={`cd frontend\nRPC_URL=${SITE.rpc.http}\nPROGRAM_ID=${process.env.NEXT_PUBLIC_PROGRAM_ID || ''}\nDOP_MINT=${process.env.NEXT_PUBLIC_DOP_MINT || ''}\nANCHOR_WALLET=/path/to/id.json \\\nnpx ts-node scripts/mintReward.ts`}
                          className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:border-white/30"
                          label="Copy Claim Cmd"
                        />
                      ) : (
                        <WalletMultiButton className="!bg-white !text-black !border !border-white/20 !rounded-lg !h-8 !text-xs px-2 hover:!bg-white/90" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

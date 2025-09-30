"use client";
import { useEffect, useMemo, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import useSWR from 'swr';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useToast } from '@/components/Toast';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StakingPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { show } = useToast();
  const address = useMemo(() => publicKey?.toBase58() || '', [publicKey]);

  const dopMintStr = process.env.NEXT_PUBLIC_DOP_MINT || '';
  const dopMint = useMemo(() => (dopMintStr ? new PublicKey(dopMintStr) : null), [dopMintStr]);

  const [dopeBalance, setDopeBalance] = useState<number | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);

  // Load DOPE wallet balance
  useEffect(() => {
    const run = async () => {
      if (!publicKey || !dopMint) { setDopeBalance(null); return; }
      setLoadingBal(true);
      try {
        const ata = await getAssociatedTokenAddress(dopMint, publicKey);
        const bal = await connection.getTokenAccountBalance(ata).catch(() => null);
        setDopeBalance(bal ? Number(bal.value.uiAmount || 0) : 0);
      } finally {
        setLoadingBal(false);
      }
    };
    run();
  }, [publicKey, connection, dopMint]);

  // Load staked amount (from DB if available)
  const { data: stakeInfo } = useSWR(
    address ? `/api/staking/${address}` : null,
    fetcher,
    { refreshInterval: 8000 }
  );
  const staked = Number(stakeInfo?.stake_amount || 0) / 1e9;

  const [stakeAmt, setStakeAmt] = useState('');
  const [unstakeAmt, setUnstakeAmt] = useState('');

  type LockOption = { key: string; label: string; days: number; multiplier: number };
  const LOCK_OPTIONS: LockOption[] = [
    { key: 'none', label: 'No Lock', days: 0, multiplier: 0 },
    { key: '7d', label: '7 Days', days: 7, multiplier: 1.0 },
    { key: '30d', label: '30 Days', days: 30, multiplier: 1.2 },
    { key: '90d', label: '90 Days', days: 90, multiplier: 1.5 },
  ];
  const [lockKey, setLockKey] = useState<string>('none');
  const selectedLock = useMemo(() => LOCK_OPTIONS.find((o) => o.key === lockKey) || LOCK_OPTIONS[0], [lockKey]);
  const amountForCalc = useMemo(() => {
    const n = Number(stakeAmt);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [stakeAmt]);

  const onMaxStake = () => {
    if (dopeBalance !== null) setStakeAmt(String(dopeBalance));
  };
  const onMaxUnstake = () => {
    setUnstakeAmt(String(staked || 0));
  };

  const onStake = async () => {
    if (!publicKey) { show('Connect your wallet'); return; }
    const amt = Number(stakeAmt);
    if (!amt || amt <= 0) { show('Enter an amount'); return; }
    if (selectedLock.days === 0) {
      show('Staking (no lock) selected — no rewards for this tier. Program update coming soon');
    } else {
      show(`Staking with ${selectedLock.days}d lock (${selectedLock.multiplier}x rewards). Program update coming soon`);
    }
  };

  const onUnstake = async () => {
    if (!publicKey) { show('Connect your wallet'); return; }
    const amt = Number(unstakeAmt);
    if (!amt || amt <= 0) { show('Enter an amount'); return; }
    show('Unstaking will be enabled after the program update');
  };

  return (
    <div className="min-h-screen text-white p-6">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Stake DOPE</h1>
        <p className="text-white/75 text-sm mb-6">Stake $DOPE to participate as a validator and increase your reward weight. Connect your wallet to begin.</p>

        {!publicKey && (
          <div className="glass rounded-xl p-4 border border-white/10 mb-8">
            <div className="text-white/80 text-sm">Connect your wallet from the menu to continue.</div>
          </div>
        )}

        {publicKey && (
          <section className="glass rounded-xl p-4 border border-white/10 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/60">Wallet</div>
                <div className="font-mono break-all text-white/90">{address}</div>
              </div>
              <div className="text-right sm:text-left">
                <div className="text-xs text-white/60">$DOPE Balance</div>
                <div className="text-white/90">{dopeBalance !== null ? dopeBalance.toLocaleString() : (loadingBal ? '—' : '0')}</div>
              </div>
            </div>
          </section>
        )}

        <section className="glass rounded-xl p-4 border border-white/10 mb-8">
          <h2 className="text-lg font-bold">How staking works</h2>
          <ul className="list-disc pl-5 mt-2 text-white/80 text-sm space-y-1">
            <li>Lock $DOPE into a staking vault controlled by the program (non‑custodial, withdrawable).</li>
            <li>Your reward weight scales with staked amount, uptime (heartbeats), and activity.</li>
            <li>Choose a lock duration for higher rewards. No‑lock tier allows instant unstake but earns no rewards.</li>
            <li>Unstake may include a cool‑down for network stability (for locked tiers).</li>
          </ul>
          <div className="mt-3 text-sm">
            Read the <Link href="/documents/validator" className="underline">Validator Docs</Link> for full details.
          </div>
        </section>

        <section className="glass rounded-xl p-4 border border-white/10 mb-8">
          <h2 className="text-lg font-bold">Your staking</h2>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-white/60">Currently staked</div>
              <div className="text-white/90 text-xl font-bold">{staked.toLocaleString()} DOPE</div>
            </div>
            <div>
              <div className="text-white/60">Estimated APR</div>
              <div className="text-white/90 text-xl font-bold">—</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold">Stake</h3>
            <div className="mt-2">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={stakeAmt}
                onChange={(e) => setStakeAmt(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              />
              <div className="mt-3">
                <div className="text-xs text-white/60 mb-1">Lock duration</div>
                <div className="flex flex-wrap gap-2">
                  {LOCK_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setLockKey(opt.key)}
                      className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                        lockKey === opt.key
                          ? 'bg-dopel-500 text-black border-dopel-400'
                          : 'bg-white/10 text-white border-white/10 hover:border-white/30'
                      }`}
                      aria-pressed={lockKey === opt.key}
                    >
                      {opt.label}{opt.days > 0 ? ` • ${opt.days}d` : ' • No rewards'}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-white/70">
                  Rewards multiplier: {selectedLock.multiplier.toFixed(2)}x {selectedLock.days === 0 ? '(no rewards)' : ''}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <button onClick={onMaxStake} className="px-2 py-1 rounded bg-white/10 border border-white/10 hover:border-white/30">Max</button>
                <div>Balance: {dopeBalance !== null ? dopeBalance : '—'}</div>
              </div>
              <button onClick={onStake} className="mt-3 w-full px-3 py-2 rounded bg-dopel-500 text-black font-bold hover:bg-dopel-400">Stake</button>
            </div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold">Unstake</h3>
            <div className="mt-2">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={unstakeAmt}
                onChange={(e) => setUnstakeAmt(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <button onClick={onMaxUnstake} className="px-2 py-1 rounded bg-white/10 border border-white/10 hover:border-white/30">Max</button>
                <div>Staked: {staked}</div>
              </div>
              <button onClick={onUnstake} className="mt-3 w-full px-3 py-2 rounded bg-white/10 border border-white/10 hover:border-white/30">Unstake</button>
            </div>
          </div>
        </section>

        <div className="mt-4 text-sm text-white/70">
          Need more details? Read the <Link className="underline" href="/documents/staking">Staking Docs</Link> for a step‑by‑step guide and CLI examples.
        </div>

        {/* Reward payout info */}
        <section className="glass rounded-xl p-4 border border-white/10 mt-4">
          <h3 className="font-semibold mb-2">Reward payouts by lock</h3>
          <p className="text-white/75 text-sm mb-3">
            Rewards scale with lock duration via a multiplier. No‑lock is flexible but earns no rewards. Payouts accrue continuously and are
            claimable in‑app from the Validators page (program update will enable this action).
          </p>
          <div className="overflow-x-auto">
            <table className="table-scan text-sm min-w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Tier</th>
                  <th className="px-3 py-2 text-left">Lock</th>
                  <th className="px-3 py-2 text-left">Multiplier</th>
                  <th className="px-3 py-2 text-left">Eligible</th>
                  <th className="px-3 py-2 text-left">Effective stake</th>
                  <th className="px-3 py-2 text-left">Payout cadence</th>
                </tr>
              </thead>
              <tbody>
                {LOCK_OPTIONS.map((opt) => {
                  const eligible = opt.days > 0;
                  const effective = amountForCalc * opt.multiplier;
                  return (
                    <tr key={opt.key} className="row-hover">
                      <td className="px-3 py-2">{opt.label}</td>
                      <td className="px-3 py-2">{opt.days > 0 ? `${opt.days} days` : 'None'}</td>
                      <td className="px-3 py-2">{opt.multiplier.toFixed(2)}x</td>
                      <td className="px-3 py-2">{eligible ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">{effective.toLocaleString()} DOPE</td>
                      <td className="px-3 py-2">Continuous; claim in app</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-white/60 mt-3">
            Notes: Effective stake is a relative weight used to apportion rewards. Actual APR and emissions are defined by network parameters and governance.
          </div>
        </section>
      </main>
    </div>
  );
}

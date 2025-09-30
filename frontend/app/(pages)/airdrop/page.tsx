
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Card } from '@/components/Card';

export default function Airdrop() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const dopMintStr = process.env.NEXT_PUBLIC_DOP_MINT || '';
  const dopMint = useMemo(() => (dopMintStr ? new PublicKey(dopMintStr) : null), [dopMintStr]);
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet').toLowerCase();

  const [amount, setAmount] = useState(100);
  const [dopeBalance, setDopeBalance] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!publicKey || !dopMint) { setDopeBalance(null); return; }
      try {
        const ata = await getAssociatedTokenAddress(dopMint, publicKey);
        const bal = await connection.getTokenAccountBalance(ata).catch(() => null);
        setDopeBalance(bal ? Number(bal.value.uiAmount || 0) : 0);
      } catch { setDopeBalance(0); }
    };
    run();
  }, [publicKey, dopMint, connection]);

  const onRequest = async () => {
    setMsg('');
    if (!publicKey) { setMsg('Connect wallet first'); return; }
    if (network === 'mainnet') { setMsg('Airdrop is disabled on mainnet. Use a DEX to acquire $DOPE.'); return; }
    setBusy(true);
    try {
      // Optional: integrate a faucet endpoint if provided
      const faucet = process.env.NEXT_PUBLIC_AIRDROP_URL;
      if (!faucet) {
        setMsg('Faucet not configured. Please use the testnet faucet or CLI.');
      } else {
        const r = await fetch(faucet, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: publicKey.toBase58(), amount })});
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || 'Faucet request failed');
        setMsg(`Requested ${amount} $DOPE. Tx: ${j?.signature || 'pending'}`);
      }
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">$DOPE Airdrop</h1>

      {/* Info cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold">What is the airdrop?</h2>
          <p className="text-white/80 text-sm">The airdrop lets you try DopelgangaChain by funding your wallet with a small amount of $DOPE for gas. On mainnet, the faucet is disabled — acquire $DOPE on a DEX instead.</p>
        </Card>
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="list-disc pl-5 text-sm text-white/80">
            <li>Connect your wallet on the right network</li>
            <li>Enter an amount (demo/test networks only)</li>
            <li>Request airdrop — your wallet receives $DOPE</li>
          </ul>
        </Card>
      </div>

      {/* Action card */}
      <Card className="space-y-3">
        <div className="text-sm text-white/70">Connected wallet</div>
        <div className="font-mono break-all text-white/90">{publicKey ? publicKey.toBase58() : 'Not connected'}</div>
        <div className="text-sm text-white/70">$DOPE Balance</div>
        <div className="text-white/90">{dopeBalance !== null ? dopeBalance.toFixed(4) : '—'} DOPE</div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Amount (testnets only)</label>
            <input type="number" className="w-full mt-1 glass rounded-lg px-3 py-2" value={amount} onChange={e=>setAmount(parseInt(e.target.value||'0'))} />
          </div>
          <div className="flex items-end">
            <button onClick={onRequest} disabled={busy}
              className="w-full px-4 py-2 rounded-xl bg-dopel-500 text-black font-semibold hover:bg-dopel-400 disabled:opacity-60">
              Request Airdrop
            </button>
          </div>
        </div>
        {msg && <div className="text-sm text-white/80 break-all">{msg}</div>}
      </Card>
    </div>
  );
}

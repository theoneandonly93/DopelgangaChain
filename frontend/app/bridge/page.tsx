"use client";
import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import useSWRMutation from 'swr/mutation';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

type QuoteReq = { sourceChain: string; token: string; amount: number };
type QuoteResp = { receiveAmount: number; fee: number; eta: string };

async function postJson(url: string, { arg }: { arg: any }) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(arg) });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export default function BridgePage() {
  const { publicKey } = useWallet();
  const { show } = useToast();
  const destAddr = useMemo(() => publicKey?.toBase58() || '', [publicKey]);

  const [sourceChain, setSourceChain] = useState('Solana');
  const [token, setToken] = useState('USDC');
  const [tokenAddr, setTokenAddr] = useState('');
  const [amount, setAmount] = useState('');

  const { trigger: getQuote, data: quote, isMutating: quoting } = useSWRMutation<QuoteResp>(
    '/api/bridge/quote',
    postJson
  );
  const { trigger: submitRequest, isMutating: submitting } = useSWRMutation(
    '/api/bridge/request',
    postJson
  );

  const onQuote = async () => {
    const n = Number(amount);
    if (!n || n <= 0) { show('Enter a valid amount'); return; }
    try {
      await getQuote({ sourceChain, token: tokenAddr || token, amount: n });
    } catch {
      show('Failed to fetch quote');
    }
  };

  const onBridge = async () => {
    const n = Number(amount);
    if (!destAddr) { show('Connect your wallet'); return; }
    if (!n || n <= 0) { show('Enter a valid amount'); return; }
    try {
      const body = { sourceChain, token: tokenAddr || token, amount: n, destAddr };
      await submitRequest(body);
      show('Bridge request submitted. Processing...');
    } catch {
      show('Failed to submit bridge request');
    }
  };

  const commonTokens = sourceChain === 'Solana'
    ? ['USDC', 'USDT', 'SOL']
    : ['USDC', 'USDT', 'WETH'];

  return (
    <div className="min-h-screen text-white p-6">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Bridge assets to Dopelganga</h1>
        <p className="text-white/75 text-sm mb-6">Bridge popular tokens or paste a token address. Your destination is your Dopelganga (Solana‑compatible) wallet.</p>

        <section className="glass rounded-xl p-4 border border-white/10 mb-6">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs text-white/60 mb-1">From chain</div>
              <select value={sourceChain} onChange={(e) => setSourceChain(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2">
                {['Solana', 'Ethereum', 'Arbitrum', 'Polygon', 'BSC', 'Base'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/60 mb-1">Token</div>
                <select value={token} onChange={(e) => setToken(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2">
                  {commonTokens.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">or paste token address</div>
                <input value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} placeholder={sourceChain === 'Solana' ? 'Mint address' : 'ERC20 address'} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/60 mb-1">Amount</div>
                <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Destination (Dopelganga)</div>
                <input value={destAddr} readOnly placeholder="Connect wallet" className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={quoting} onClick={onQuote} className="px-3 py-2 rounded bg-white/10 border border-white/10 hover:border-white/30 disabled:opacity-60">{quoting ? 'Quoting…' : 'Get Quote'}</button>
              <button disabled={submitting} onClick={onBridge} className="px-3 py-2 rounded bg-dopel-500 text-black font-bold hover:bg-dopel-400 disabled:opacity-60">{submitting ? 'Submitting…' : 'Start Bridge'}</button>
            </div>
          </div>
        </section>

        {quote && (
          <section className="glass rounded-xl p-4 border border-white/10 mb-6">
            <h3 className="font-semibold">Quote</h3>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div className="text-white/60">Fee</div>
              <div className="text-white/90">{quote.fee}</div>
              <div className="text-white/60">You receive</div>
              <div className="text-white/90">{quote.receiveAmount}</div>
              <div className="text-white/60">Estimated time</div>
              <div className="text-white/90">{quote.eta}</div>
            </div>
          </section>
        )}

        <section className="glass rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-2">How bridging works</h3>
          <ul className="list-disc pl-5 text-white/80 text-sm space-y-1">
            <li>Tokens are locked/burned on the source chain and minted/unlocked on Dopelganga as wrapped assets.</li>
            <li>If a wrapped token doesn’t exist yet, it’s deployed as part of the first bridge.</li>
            <li>Fees cover relayer costs and destination minting; large transfers may require additional confirmations.</li>
            <li>Bridge status and claims will be visible in your activity and the Validators/Explorer pages once live.</li>
          </ul>
          <div className="mt-3 text-xs text-white/60">Note: Full bridge execution will be enabled once the relayer is live. For now, requests are recorded and quotes are indicative.</div>
        </section>
      </main>
    </div>
  );
}


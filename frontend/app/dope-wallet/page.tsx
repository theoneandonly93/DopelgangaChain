"use client";

import { useState, useCallback } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { Card } from '@/components/Card';
import { generateDopeWallet, saveDopeWalletToStorage } from '@/utils/dopeWallet';
import { useWallet } from '@solana/wallet-adapter-react';
import { LocalDopeWalletName } from '@/components/adapters/LocalDopeWalletAdapter';

type Generated = ReturnType<typeof generateDopeWallet> | null;

export default function DopeWalletPage() {
  const [generated, setGenerated] = useState<Generated>(null);
  const [status, setStatus] = useState<string>('');
  const { select, connect } = useWallet();

  const onGenerate = useCallback(() => {
    const w = generateDopeWallet();
    setGenerated(w);
    setStatus('Wallet generated. Save your details now.');
  }, []);

  const onUpdateAccount = useCallback(async () => {
    if (!generated) return;
    saveDopeWalletToStorage(generated);
    // Notify provider to re-read local storage and include adapter
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dopewallet:updated'));
      // Give the provider a tick to pick up the new adapter
      await new Promise((r) => setTimeout(r, 50));
    }
    try {
      // Select our local adapter and connect
      select(LocalDopeWalletName);
      await connect();
      setStatus('Connected to DopelgangaChain with Dope Wallet.');
    } catch (e: any) {
      setStatus(e?.message || 'Failed to connect. Open wallet in navbar.');
    }
  }, [generated, select, connect]);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Dope Wallet</h1>
      <p className="text-white/75 mb-6">Generate a DopelgangaChain account and connect it to this app.</p>

      <div className="glass rounded-2xl border border-white/10 p-5 md:p-6 shadow-card">
        {!generated && (
          <div className="text-center">
            <p className="text-white/80 mb-4">Create a new wallet with a seed phrase and private key.</p>
            <button onClick={onGenerate} className="px-5 py-2.5 rounded-xl bg-dopel-500 text-black font-bold hover:bg-dopel-400 shadow-card">Get Started</button>
            <div className="text-xs text-white/50 mt-3">A new account is generated locally in your browser.</div>
          </div>
        )}

        {generated && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-100 p-3 text-sm">
              Save these details securely. Anyone with them can access your funds. We do not store this anywhere.
            </div>

            <Card className="shadow-card">
              <div className="text-xs text-white/60 mb-1">Seed Phrase (12 words)</div>
              <div className="font-mono break-words whitespace-pre-wrap text-white/90">{generated.mnemonic}</div>
              <div className="mt-3"><CopyButton value={generated.mnemonic} label="Copy Seed Phrase" className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-white/30" /></div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-card">
                <div className="text-xs text-white/60 mb-1">Public Address</div>
                <div className="font-mono break-all">{generated.publicKey}</div>
                <div className="mt-3"><CopyButton value={generated.publicKey} label="Copy Address" className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-white/30" /></div>
              </Card>
              <Card className="shadow-card">
                <div className="text-xs text-white/60 mb-1">Private Key (base58)</div>
                <div className="font-mono break-all">{generated.secretKey}</div>
                <div className="mt-3"><CopyButton value={generated.secretKey} label="Copy Private Key" className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-white/30" /></div>
              </Card>
            </div>

            <div className="text-xs text-white/60">
              Derivation Path: <span className="font-mono">{generated.derivationPath}</span>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button onClick={onUpdateAccount} className="px-4 py-2 rounded-xl bg-white text-black font-bold border border-white/20 hover:bg-white/90">Update Account</button>
              <CopyButton value={`Address: ${generated.publicKey}\nSeed: ${generated.mnemonic}\nPrivateKey(base58): ${generated.secretKey}`} label="Copy All" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30" />
            </div>

            {status && (
              <div className="text-sm text-white/70">{status}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

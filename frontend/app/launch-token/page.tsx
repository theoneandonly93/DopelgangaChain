"use client";
import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { MINT_SIZE, getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToCheckedInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export default function LaunchTokenPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState("0");
  const [mintPubkey, setMintPubkey] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // Metadata fields
  const [name, setName] = useState("My Token");
  const [symbol, setSymbol] = useState("MTK");
  const [description, setDescription] = useState("A new token on DopelgangaChain");
  const [image, setImage] = useState("https://www.dopelganga.com/logo.png");
  const [website, setWebsite] = useState("https://www.dopelganga.com/explorer");
  const [twitter, setTwitter] = useState("https://x.com/dopelgangafi");
  const [explorer, setExplorer] = useState("https://dopelgangachain.xyz/explorer");

  const metadataJson = useMemo(() => ({
    name: name.trim().slice(0, 32),
    symbol: symbol.trim().slice(0, 10),
    description: description.trim(),
    image: image.trim(),
    extensions: {
      website: website.trim(),
      twitter: twitter.trim(),
      explorer: explorer.trim(),
    },
  }), [name, symbol, description, image, website, twitter, explorer]);

  const onDownloadJson = () => {
    try {
      const blob = new Blob([JSON.stringify(metadataJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(name || 'token').replace(/\s+/g,'_').toLowerCase()}_metadata.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('Metadata JSON downloaded. Host it at a public URL (e.g., your domain /metadata/) and set the URI on-chain with the provided scripts.');
    } catch (e: any) {
      setMsg(e?.message || String(e));
    }
  };

  const onCreateMint = async () => {
    if (!publicKey || !signTransaction) {
      setMsg("Connect wallet first");
      return;
    }
    try {
      setBusy(true); setMsg("");
      const mint = Keypair.generate();
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      // Partially sign with the new mint first, then have the wallet co-sign
      tx.partialSign(mint);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setMintPubkey(mint.publicKey.toBase58());
      setMsg(`Mint account created: ${mint.publicKey.toBase58()}`);
    } catch (e: any) {
      setMsg(`Create mint failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const onLaunch = async () => {
    if (!publicKey || !signTransaction) { setMsg("Connect wallet first"); return; }
    if (!mintPubkey) { setMsg("Create or paste a mint address first"); return; }
    try {
      setBusy(true); setMsg("");
      const mint = new PublicKey(mintPubkey);
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      const ataInfo = await connection.getAccountInfo(ata);
      if (!ataInfo) {
        const tx = new Transaction().add(
          createAssociatedTokenAccountInstruction(publicKey, ata, publicKey, mint)
        );
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signed = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
      }
      // Initialize mint via SPL and optionally mint initial supply
      const tx2 = new Transaction();
      tx2.add(createInitializeMint2Instruction(mint, decimals, publicKey, null));
      const initSupplyNum = Number(initialSupply || "0");
      if (initSupplyNum > 0) {
        const amount = BigInt(Math.floor(initSupplyNum * 10 ** decimals));
        tx2.add(createMintToCheckedInstruction(mint, ata, publicKey, amount, decimals));
      }
      tx2.feePayer = publicKey;
      tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signed2 = await signTransaction(tx2);
      const sig2 = await connection.sendRawTransaction(signed2.serialize());
      await connection.confirmTransaction(sig2, 'confirmed');
      setMsg(`Launched token via SPL. Signature: ${sig2}`);
    } catch (e: any) {
      setMsg(`Launch failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Launch Token</h1>

      {/* Metadata card */}
      <div className="glass rounded-xl p-4 space-y-4 border border-white/10">
        <h2 className="text-lg font-semibold">Metadata</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70">Name</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/70">Symbol</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={symbol} onChange={(e)=>setSymbol(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">Description</label>
            <textarea className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">Image URL</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={image} onChange={(e)=>setImage(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/70">Website</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={website} onChange={(e)=>setWebsite(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/70">Twitter</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={twitter} onChange={(e)=>setTwitter(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">Explorer URL</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" value={explorer} onChange={(e)=>setExplorer(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onDownloadJson} className="px-4 py-2 rounded bg-white text-black">Download metadata JSON</button>
          <a href="/documents/tokens" className="px-4 py-2 rounded bg-white/10 border border-white/10 hover:border-white/30">How to set metadata</a>
        </div>
      </div>

      {/* Mint + supply card */}
      <div className="glass rounded-xl p-4 space-y-4 border border-white/10 max-w-xl">
        <label className="block text-sm">Decimals</label>
        <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10"
          type="number" value={decimals} min={0} max={9}
          onChange={(e)=>setDecimals(Number(e.target.value))} />

        <label className="block text-sm">Initial Supply (human units)</label>
        <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10"
          type="number" value={initialSupply}
          onChange={(e)=>setInitialSupply(e.target.value)} />

        <label className="block text-sm">Mint Address</label>
        <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 font-mono"
          placeholder="Paste or create a new mint"
          value={mintPubkey}
          onChange={(e)=>setMintPubkey(e.target.value)} />

        <div className="flex gap-3">
          <button disabled={busy} onClick={onCreateMint} className="px-4 py-2 rounded bg-white text-black disabled:opacity-60">Create Mint Account</button>
          <button disabled={busy} onClick={onLaunch} className="px-4 py-2 rounded bg-dopel-500 text-black font-bold disabled:opacity-60">Launch</button>
        </div>

        {msg && <div className="text-sm text-white/80 break-all">{msg}</div>}
      </div>
      <p className="text-xs text-white/50 mt-3">Note: This page creates the mint account with your wallet as payer, initializes it via SPL, and optionally mints initial supply to your wallet. To set on‑chain metadata, host the JSON you downloaded at a public URL and run the CLI script from the repo: <code>npm run token:metadata:set</code>.</p>
    </div>
  );
}

"use client";
import { useState } from "react";
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
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Launch Token</h1>
      <div className="glass rounded-xl p-4 space-y-4">
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
      <p className="text-xs text-white/50 mt-3">Note: This demo creates the mint account with your wallet as payer, then calls the on-chain program to initialize and optionally mint the initial supply to your wallet.</p>
    </div>
  );
}

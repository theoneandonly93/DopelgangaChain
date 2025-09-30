"use client";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction } from "@solana/spl-token";

const DOP_MINT = (process.env.NEXT_PUBLIC_DOP_MINT || '').trim();

export default function ReferralPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [inviter, setInviter] = useState("");
  const [reward, setReward] = useState("0");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const onBind = async () => {
    try {
      if (!publicKey) { setMsg('Connect wallet'); return; }
      if (!DOP_MINT) { setMsg('DOP mint not configured'); return; }
      const mint = new PublicKey(DOP_MINT);
      const inviterPk = new PublicKey(inviter);
      setBusy(true); setMsg("");

      // Ensure inviter ATA exists (payer = current wallet)
      const ata = await getAssociatedTokenAddress(mint, inviterPk);
      const info = await connection.getAccountInfo(ata);
      if (!info) {
        const tx = new Transaction().add(
          createAssociatedTokenAccountInstruction(publicKey, ata, inviterPk, mint)
        );
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signed = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, 'confirmed');
      }

      // Simple reward: transfer DOPE from user to inviter
      const decimals = 9;
      const fromAta = await getAssociatedTokenAddress(mint, publicKey);
      const amount = BigInt(Math.floor(Number(reward || '0') * 10 ** decimals));
      const tx2 = new Transaction().add(
        createTransferCheckedInstruction(fromAta, mint, ata, publicKey, amount, decimals)
      );
      tx2.feePayer = publicKey;
      tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signed2 = await signTransaction(tx2);
      const sig2 = await connection.sendRawTransaction(signed2.serialize());
      await connection.confirmTransaction(sig2, 'confirmed');
      setMsg(`Referral bound + reward sent. Signature: ${sig2}`);
    } catch (e: any) {
      setMsg(`Bind failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Referral</h1>
      {/* Info cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 space-y-2 border border-white/10">
          <h2 className="text-lg font-semibold">How referrals work</h2>
          <ul className="list-disc pl-5 text-sm text-white/80">
            <li>You can bind a single inviter to your wallet.</li>
            <li>The reward is paid in $DOPE to the inviter’s token account.</li>
            <li>Make sure the inviter address is valid; this is permanent.</li>
          </ul>
        </div>
        <div className="glass rounded-xl p-4 space-y-2 border border-white/10">
          <h2 className="text-lg font-semibold">Before you begin</h2>
          <ul className="list-disc pl-5 text-sm text-white/80">
            <li>Connect your wallet on the correct network.</li>
            <li>Have a small amount of $DOPE for fees and reward (if sending).</li>
            <li>Inviter will receive the reward instantly after binding.</li>
          </ul>
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-4 max-w-xl">
        <label className="block text-sm">Inviter Address</label>
        <input value={inviter} onChange={(e)=>setInviter(e.target.value)}
          placeholder="Enter inviter public key"
          className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 font-mono" />

        <label className="block text-sm">Reward (DOPE)</label>
        <input value={reward} onChange={(e)=>setReward(e.target.value)}
          className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />

        <button disabled={busy} onClick={onBind} className="px-4 py-2 rounded bg-dopel-500 text-black font-bold disabled:opacity-60">Bind Referral</button>
        {msg && <div className="text-sm text-white/80 break-all">{msg}</div>}
      </div>
      <p className="text-xs text-white/50 mt-3">Note: You can bind a referral one time. The reward (if any) mints DOPE to the inviter.</p>
    </div>
  );
}

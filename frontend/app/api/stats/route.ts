import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { Connection, PublicKey } from "@solana/web3.js";

export async function GET() {
  try {
    // Prefer live on-chain supply for the configured mint; fall back to DB sum
    const DOP_MINT = process.env.DOP_MINT || process.env.NEXT_PUBLIC_DOP_MINT || '';
  const RPC = process.env.SOLANA_RPC || process.env.RPC_UPSTREAM_URL || process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

    let dopelSupply = 0;
    if (DOP_MINT) {
      try {
        const conn = new Connection(RPC, 'confirmed');
        const sup = await conn.getTokenSupply(new PublicKey(DOP_MINT));
        // uiAmount is in human units; convert to raw base units for consistency with DB (optional)
        // Here we return human units for display directly.
        dopelSupply = Number(sup.value.uiAmount || 0);
      } catch (e) {
        // Fallback to DB sum of minted amounts
        const { data: mintRows, error: mintError } = await supabase
          .from('dopel_transactions')
          .select('amount')
          .eq('type', 'Mint');
        if (mintError) throw mintError;
        dopelSupply = (mintRows || []).reduce((sum: number, row: any) => sum + Number(row.amount), 0) / 1e9;
      }
    }
    // Get latest block height
    const { data: blockRows, error: blockError } = await supabase
      .from('dopel_blocks')
      .select('block_number')
      .order('block_number', { ascending: false })
      .limit(1);
    if (blockError) throw blockError;
    const blockHeight = Number(blockRows?.[0]?.block_number || 0);
    // Rewards stats
    const { data: sumRows, error: sumErr } = await supabase
      .from('validator_rewards')
      .select('amount');
    if (sumErr) throw sumErr;
    const totalRewards = (sumRows || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
    const { data: lastReward, error: lastErr } = await supabase
      .from('validator_rewards')
      .select('amount')
      .order('id', { ascending: false })
      .limit(1);
    if (lastErr) throw lastErr;
    const rewardPerBlock = Number(lastReward?.[0]?.amount || 0);

    // Live TPS via RPC performance samples
    let tps = 0;
    let tpsHistory: number[] = [];
    try {
      const perfConn = new Connection(RPC, 'confirmed');
      const samples = await perfConn.getRecentPerformanceSamples(5);
      if (Array.isArray(samples) && samples.length > 0) {
        tpsHistory = samples.map((s: any) => (s.numTransactions || s.transactions || 0) / (s.samplePeriodSecs || 1)).map((v: number) => Math.round(v));
        tps = tpsHistory[0] || 0;
      }
    } catch (_) { /* keep zeros on error */ }

    // Epoch placeholder (can be fetched via RPC getEpochInfo if desired)
    const epoch = 851;
    return NextResponse.json({ dopelSupply, epoch, blockHeight, tps, tpsHistory, totalRewards, rewardPerBlock });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
  try {
    // Get total supply (sum of Mint txs)
    const { data: mintRows, error: mintError } = await supabase
      .from('dopel_transactions')
      .select('amount')
      .eq('type', 'Mint');
    if (mintError) throw mintError;
    const dopelSupply = (mintRows || []).reduce((sum: number, row: any) => sum + Number(row.amount), 0);
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

    // Placeholder epoch and TPS
    const epoch = 851;
    const tps = 892;
    const tpsHistory = [750, 800, 900, 1000, 850];
    return NextResponse.json({ dopelSupply, epoch, blockHeight, tps, tpsHistory, totalRewards, rewardPerBlock });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

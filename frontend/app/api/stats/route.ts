import { NextResponse } from "next/server";
import db from "@/utils/db";

export async function GET() {
  try {
    // Get total supply (sum of Mint txs)
    const { rows: mintRows } = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS supply FROM dopel_transactions WHERE type = 'Mint'`
    );
    const dopelSupply = Number(mintRows[0]?.supply || 0);
    // Get latest block height
    const { rows: blockRows } = await db.query(
      `SELECT MAX(block_number) AS height FROM dopel_blocks`
    );
    const blockHeight = Number(blockRows[0]?.height || 0);
    // Placeholder epoch and TPS
    const epoch = 851;
    const tps = 892;
    const tpsHistory = [750, 800, 900, 1000, 850];
    return NextResponse.json({ dopelSupply, epoch, blockHeight, tps, tpsHistory });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import db from "@/utils/db";

export async function GET() {
  try {
    const result = await db.query(
      `SELECT signature, type, amount, from_addr AS "from", to_addr AS "to", timestamp
       FROM dopel_transactions
       ORDER BY id DESC
       LIMIT 20`
    );
    // Format time as ISO string
    const txs = result.rows.map((tx: any) => ({
      ...tx,
      time: new Date(Number(tx.timestamp)).toISOString()
    }));
    return NextResponse.json(txs);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

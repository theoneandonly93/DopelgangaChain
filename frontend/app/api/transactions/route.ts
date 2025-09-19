import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dopel_transactions')
      .select('signature, type, amount, from_addr, to_addr, timestamp')
      .order('id', { ascending: false })
      .limit(20);
    if (error) throw error;
    // Format time as ISO string
    const txs = (data || []).map((tx: any) => ({
      ...tx,
      from: tx.from_addr,
      to: tx.to_addr,
      time: new Date(Number(tx.timestamp)).toISOString()
    }));
    return NextResponse.json(txs);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

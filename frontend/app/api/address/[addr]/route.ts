import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(_req: Request, context: { params: { addr: string } }) {
  try {
    const addr = context.params.addr;
    const { data, error } = await supabase
      .from('dopel_transactions')
      .select('signature, type, amount, from_addr, to_addr, timestamp')
      .or(`from_addr.eq.${addr},to_addr.eq.${addr}`)
      .order('id', { ascending: false })
      .limit(20);
    if (error) throw error;
    const txs = (data || []).map((row: any) => ({
      signature: row.signature,
      type: row.type,
      amount: Number(row.amount),
      from: row.from_addr,
      to: row.to_addr,
      time: new Date(Number(row.timestamp)).toISOString(),
    }));
    return NextResponse.json({ address: addr, txs });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed to fetch address activity' }, { status: 500 });
  }
}


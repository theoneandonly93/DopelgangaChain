import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(_req: Request, context: { params: { sig: string } }) {
  try {
    const sig = context.params.sig;
    // Try exact match first
    let { data, error } = await supabase
      .from('dopel_transactions')
      .select('id, signature, type, amount, from_addr, to_addr, timestamp')
      .eq('signature', sig)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const row: any = data;
      return NextResponse.json({
        id: row.id,
        signature: row.signature,
        type: row.type,
        amount: Number(row.amount),
        from: row.from_addr,
        to: row.to_addr,
        time: new Date(Number(row.timestamp)).toISOString(),
      });
    }
    // Fallback: prefix match for derived signatures like `${sig}-i`
    const prefix = `${sig}-`;
    const listResp = await supabase
      .from('dopel_transactions')
      .select('id, signature, type, amount, from_addr, to_addr, timestamp')
      .like('signature', `${prefix}%`)
      .order('id', { ascending: true })
      .limit(50);
    if (listResp.error) throw listResp.error;
    const arr = (listResp.data || []).map((row: any) => ({
      id: row.id,
      signature: row.signature,
      type: row.type,
      amount: Number(row.amount),
      from: row.from_addr,
      to: row.to_addr,
      time: new Date(Number(row.timestamp)).toISOString(),
    }));
    if (arr.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return NextResponse.json(arr);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}


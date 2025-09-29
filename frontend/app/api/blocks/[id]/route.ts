import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(_req: Request, context: { params: { id: string } }) {
  try {
    const idNum = Number(context.params.id);
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ error: "Invalid block id" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('dopel_blocks')
      .select('block_number, timestamp, events')
      .eq('block_number', idNum)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Block not found" }, { status: 404 });

    const eventsRaw = typeof data.events === 'string' ? JSON.parse(data.events) : (data.events || []);
    const events = (Array.isArray(eventsRaw) ? eventsRaw : []).map((e: any) => {
      if (typeof e === 'string') {
        return { type: e.split(':')[0] || 'Unknown' };
      }
      return {
        type: e?.type ?? 'Unknown',
        from: e?.from ?? null,
        to: e?.to ?? null,
        amount: Number(e?.amount ?? 0) || 0,
        signature: e?.signature ?? undefined,
      };
    });

    const block = {
      blockNumber: Number(data.block_number),
      timestamp: Number(data.timestamp),
      events,
    };
    return NextResponse.json(block);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch block" }, { status: 500 });
  }
}


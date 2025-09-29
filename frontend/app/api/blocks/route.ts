import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const { data, error } = await supabase
      .from('dopel_blocks')
      .select('block_number, timestamp, events')
      .order('block_number', { ascending: false })
      .limit(limit);
    if (error) throw error;
    // Normalize shape for Explorer UI
    const blocks = (data || []).map((row: any) => ({
      blockNumber: Number(row.block_number),
      timestamp: Number(row.timestamp),
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events
    }));
    return NextResponse.json(blocks);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 });
  }
}

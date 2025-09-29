import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
  try {
    // If the view is created, we can query it directly; otherwise aggregate in query
    const { data, error } = await supabase
      .from('validator_leaderboard')
      .select('validator, total_rewards')
      .order('total_rewards', { ascending: false })
      .limit(10);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e) {
    console.warn('Falling back to aggregate since view may not exist:', e?.message || e);
    try {
      const { data, error } = await supabase
        .from('validator_rewards')
        .select('validator, amount');
      if (error) throw error;
      const map = new Map<string, number>();
      for (const r of data || []) {
        const v = String((r as any).validator);
        const a = Number((r as any).amount || 0);
        map.set(v, (map.get(v) || 0) + a);
      }
      const arr = Array.from(map.entries()).map(([validator, total]) => ({ validator, total_rewards: total }))
        .sort((a, b) => b.total_rewards - a.total_rewards)
        .slice(0, 10);
      return NextResponse.json(arr);
    } catch (err) {
      console.error("API error:", err);
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
  }
}


import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('validator_rewards')
      .select('id, block, validator, amount, timestamp')
      .order('id', { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}


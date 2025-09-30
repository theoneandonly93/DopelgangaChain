import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'

export async function GET(
  _req: Request,
  context: { params: { addr: string } }
) {
  const addr = context.params.addr
  try {
    // Query optional validator_stakes table; return zeros if not found or table missing
    const { data, error } = await supabase
      .from('validator_stakes')
      .select('stake_amount, last_heartbeat')
      .eq('validator_pubkey', addr)
      .maybeSingle()
    if (error) throw error
    const stake_amount = Number(data?.stake_amount || 0)
    const last_heartbeat = Number(data?.last_heartbeat || 0)
    return NextResponse.json({ stake_amount, last_heartbeat })
  } catch (err: any) {
    // Return zeros if table/view doesn't exist or errors
    return NextResponse.json({ stake_amount: 0, last_heartbeat: 0 })
  }
}


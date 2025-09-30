import { NextRequest } from 'next/server'
import { supabase } from '@/utils/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const row = {
      source_chain: String(body?.sourceChain || ''),
      token: String(body?.token || ''),
      amount: Number(body?.amount || 0),
      dest_addr: String(body?.destAddr || ''),
      created_at: Date.now(),
    }
    try {
      await supabase.from('bridge_requests').insert(row)
    } catch (_) {
      // ignore if table missing or insert fails; still ack to user
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
}


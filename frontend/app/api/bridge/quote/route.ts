import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const amount = Number(body?.amount || 0)
    // Simple indicative fee model: 0.2% with min 0.5 units
    const pct = 0.002
    const min = 0.5
    const fee = Math.max(min, Math.round((amount * pct) * 1e6) / 1e6)
    const receive = Math.max(0, Math.round((amount - fee) * 1e6) / 1e6)
    const eta = amount > 10000 ? '10–20 min' : '2–10 min'
    return new Response(JSON.stringify({ fee, receiveAmount: receive, eta }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'failed to quote' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
}


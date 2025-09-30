import { NextRequest } from 'next/server'

// Node.js runtime for serverless function; Vercel supports this for app routes.
export const runtime = 'nodejs'

const UPSTREAM = process.env.RPC_UPSTREAM_URL || process.env.QUICKNODE_URL || ''
const ALLOWED_ORIGINS = [
  'https://www.dopelganga.com',
  'https://dopelganga.com',
  'https://www.dopelgangachain.xyz',
  'https://dopelgangachain.xyz',
  'http://localhost:3000',
]

function corsHeaders(origin: string) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ''
  return new Headers({
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  })
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(req: NextRequest) {
  if (!UPSTREAM) {
    return new Response(JSON.stringify({ error: 'RPC upstream not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  const origin = req.headers.get('origin') || ''
  try {
    // Read body as text to avoid Node 18 fetch duplex requirement
    const reqBodyText = await req.text()
    const resp = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: reqBodyText,
    })
    const respBodyText = await resp.text()
    const hdrs = corsHeaders(origin)
    hdrs.set('content-type', resp.headers.get('content-type') || 'application/json')
    return new Response(respBodyText, { status: resp.status, headers: hdrs })
  } catch (e: any) {
    const hdrs = corsHeaders(origin)
    hdrs.set('content-type', 'application/json')
    return new Response(JSON.stringify({ error: 'RPC proxy failed', message: String(e?.message || e) }), {
      status: 502,
      headers: hdrs,
    })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } })
}

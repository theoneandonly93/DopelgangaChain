// Cloudflare Worker: Solana RPC HTTP + WebSocket proxy
// - HTTP JSON-RPC: POST body forwarded to QN_URL (or QN_HTTP_URL)
// - WebSocket: Upgrade proxied to QN_WS_URL (or derived from QN_URL)

export interface Env {
  QN_URL?: string
  QN_HTTP_URL?: string
  QN_WS_URL?: string
  ALLOW_ORIGINS?: string
}

const DEFAULT_ALLOWED = [
  'https://www.dopelganga.com',
  'https://dopelganga.com',
  'https://www.dopelgangachain.xyz',
  'https://dopelgangachain.xyz',
  'http://localhost:3000',
]

function pickAllowed(origin: string, env: Env) {
  const extra = (env.ALLOW_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const allowed = new Set([...DEFAULT_ALLOWED, ...extra])
  return allowed.has(origin) ? origin : ''
}

function corsHeaders(origin: string, env: Env) {
  const allow = pickAllowed(origin, env)
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('origin') || ''

    // Health/status
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) })
    }

    const httpUpstream = env.QN_HTTP_URL || env.QN_URL
    if (!httpUpstream) {
      return new Response(JSON.stringify({ error: 'QN_URL not configured' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    }

    // WebSocket proxy
    if (request.headers.get('upgrade') === 'websocket') {
      const wsUpstream = env.QN_WS_URL || httpUpstream.replace(/^http/i, 'ws')
      return fetch(new Request(wsUpstream, request))
    }

    // HTTP JSON-RPC
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      })
    }

    try {
      const bodyText = await request.text()
      const upstreamResp = await fetch(httpUpstream, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: bodyText,
      })
      const outText = await upstreamResp.text()
      const hdrs = new Headers(corsHeaders(origin, env))
      hdrs.set('content-type', upstreamResp.headers.get('content-type') || 'application/json')
      return new Response(outText, { status: upstreamResp.status, headers: hdrs })
    } catch (e: any) {
      const hdrs = new Headers(corsHeaders(origin, env))
      hdrs.set('content-type', 'application/json')
      return new Response(JSON.stringify({ error: 'upstream fetch failed', message: String(e?.message || e) }), {
        status: 502,
        headers: hdrs,
      })
    }
  },
}

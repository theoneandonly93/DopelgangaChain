Cloudflare Worker: Solana RPC HTTP + WebSocket Proxy
====================================================

This Worker exposes a branded RPC endpoint with full WebSocket support. Use it for:

- HTTP JSON‑RPC (POST)
- WebSocket subscriptions (wss://)

You can keep the in‑app HTTP proxy (/api/rpc) for simple requests and use this Worker for WS subscriptions, or point both HTTP and WS to the Worker.

Quick Start (workers.dev)
------------------------
1) Install and auth Wrangler

   npm i -g wrangler
   wrangler login

2) Configure secrets (paste your QuickNode HTTPS endpoint when prompted)

   cd cloudflare/rpc-worker
   wrangler secret put QN_URL

   # Optional: if your WS endpoint differs, set explicitly
   # wrangler secret put QN_WS_URL

3) Deploy (workers.dev URL)

   wrangler deploy

   # Outputs something like:
   #  https://dopel-rpc.<account>.workers.dev

4) Test

   # HTTP JSON‑RPC
   curl -sS https://dopel-rpc.<account>.workers.dev \
     -H 'content-type: application/json' \
     --data-binary '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

   # WebSocket (requires wscat or websocket client)
   wscat -c wss://dopel-rpc.<account>.workers.dev
   > {"jsonrpc":"2.0","id":1,"method":"getHealth"}

Custom Domain (rpc.dopelgangachain.xyz)
---------------------------------------
To use a custom domain, your zone must be managed by Cloudflare.

1) Point your domain’s nameservers to Cloudflare (add the zone).
2) In Cloudflare Dashboard → Workers → Your Worker → Triggers → Custom Domains → Add:
   - Domain: rpc.dopelgangachain.xyz
3) Wait for TLS to provision (status: Active), then test:

   curl -sS https://rpc.dopelgangachain.xyz \
     -H 'content-type: application/json' \
     --data-binary '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

Environment
-----------
Secrets (set via `wrangler secret put ...`):

- QN_URL      (required)  QuickNode HTTPS endpoint (e.g., https://<subdomain>.quiknode.pro/<token>/)
- QN_WS_URL   (optional)  QuickNode WSS endpoint; if not set, derived from QN_URL by replacing http→ws
- ALLOW_ORIGINS (optional) Comma‑separated list of allowed CORS origins (default allows your domains + localhost)

Integration
-----------
- Indexer/server (WebSocket subscriptions):
  - Use WS endpoint: wss://rpc.dopelgangachain.xyz (or workers.dev URL)
- Frontend/browser:
  - Keep HTTP at https://dopelgangachain.xyz/api/rpc (in‑app proxy), or switch to the Worker HTTP URL.

Local Dev
---------
You can run the Worker locally:

  wrangler dev

Then call http://127.0.0.1:8787 like you would the deployed endpoint.


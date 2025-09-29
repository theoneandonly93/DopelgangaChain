# DopelgangaChain Indexer
Node.js indexer for DopelgangaChain events. Persists blocks and transactions to Postgres (via Supabase).

## Configure

Env vars (see root `.env.example`):

- `PROGRAM_ID` – your on-chain program ID
- `RPC_URL` – Solana RPC endpoint (default mainnet)
- `SUPABASE_URL` – Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (server-only)

Create `indexer/.env` with these values or use the root `.env`.

## Run

```
npm --prefix indexer start
```

The service will:
- Subscribe to `onLogs(PROGRAM_ID)` with commitment `confirmed`
- Create a logical LayerBlock for each transaction emitting program logs
- Insert block rows into `dopel_blocks` and derived tx rows into `dopel_transactions`
- Expose debug endpoints on `http://localhost:8080`

### Health endpoints

- `GET /health` – liveness + status snapshot `{ rpcOk, dbOk, subscribed, lastBlockNumber, lastSignature, lastInsertTs }`
- `GET /ready` – readiness (200 only when RPC + DB OK and subscribed)

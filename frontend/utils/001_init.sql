-- DopelgangaChain Database Schema

-- Blocks table (stores Dopel blocks from the indexer)
CREATE TABLE IF NOT EXISTS dopel_blocks (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    events JSONB NOT NULL
);

-- Transactions table (stores transfers, mints, referrals, launches, etc.)
CREATE TABLE IF NOT EXISTS dopel_transactions (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL,
    type TEXT NOT NULL,
    amount BIGINT NOT NULL,
    from_addr TEXT,
    to_addr TEXT,
    timestamp BIGINT NOT NULL
);

-- Helpful indexes for queries
CREATE INDEX IF NOT EXISTS idx_blocks_number ON dopel_blocks(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_tx_signature ON dopel_transactions(signature);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON dopel_transactions(timestamp DESC);

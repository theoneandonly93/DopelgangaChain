-- Ensure uniqueness and fast dedupe

-- Unique block_number for dopel_blocks
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_dopel_blocks_block_number
ON dopel_blocks (block_number);

-- Unique signature for dopel_transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_dopel_transactions_signature
ON dopel_transactions (signature);


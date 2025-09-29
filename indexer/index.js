
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase, dbEnabled } = require('./db');

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Health state
const health = {
  rpcOk: false,
  dbOk: false,
  subscribed: false,
  lastBlockNumber: 0,
  lastSignature: null,
  lastInsertTs: 0,
};

let blockNumber = 1;
const layerBlocks = [];
const memoryTransactions = [];
const memoryValidatorRewards = [];


// Start Express server
const app = express();
app.use(cors());
app.use(express.json());

// --- API ENDPOINTS ---

// Liveness/Readiness
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', dbEnabled, ...health });
});
app.get('/ready', (_req, res) => {
  const ready = health.rpcOk && health.dbOk && health.subscribed;
  return ready
    ? res.json({ status: 'ready', dbEnabled, ...health })
    : res.status(503).json({ status: 'not_ready', dbEnabled, ...health });
});

// List recent blocks (most recent first)
app.get('/blocks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    if (!dbEnabled) {
      const blocks = layerBlocks.slice(-limit).reverse();
      return res.json({ blocks });
    }
    const { data, error } = await supabase
      .from('dopel_blocks')
      .select('*')
      .order('block_number', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const blocks = (data || []).map((row) => ({
      blockNumber: Number(row.block_number),
      timestamp: Number(row.timestamp),
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events
    }));
    res.json({ blocks });
  } catch (e) {
    console.error('GET /blocks error:', e);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// Get block by blockNumber
app.get('/blocks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid block id' });
    if (!dbEnabled) {
      const block = layerBlocks.find((b) => b.blockNumber === id);
      if (!block) return res.status(404).json({ error: 'Block not found' });
      return res.json(block);
    }
    const { data, error } = await supabase
      .from('dopel_blocks')
      .select('block_number, timestamp, events')
      .eq('block_number', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Block not found' });
    const eventsRaw = typeof data.events === 'string' ? JSON.parse(data.events) : (data.events || []);
    const events = (Array.isArray(eventsRaw) ? eventsRaw : []).map((e, i) => {
      if (typeof e === 'string') return { type: e.split(':')[0] || 'Unknown' };
      return {
        type: e?.type || 'Unknown',
        from: e?.from || null,
        to: e?.to || null,
        amount: Number(e?.amount || 0),
        signature: e?.signature || undefined,
      };
    });
    res.json({
      blockNumber: Number(data.block_number),
      timestamp: Number(data.timestamp),
      events,
    });
  } catch (e) {
    console.error('GET /blocks/:id error:', e);
    res.status(500).json({ error: 'Failed to fetch block' });
  }
});

// --- Explorer API ---
app.get('/api/stats', async (req, res) => {
  try {
    let dopelSupply = 0;
    let blockHeight = layerBlocks.length;
    let totalRewards = memoryValidatorRewards.reduce((s, r) => s + Number(r.amount || 0), 0);
    let rewardPerBlock = memoryValidatorRewards.length > 0 ? Number(memoryValidatorRewards[memoryValidatorRewards.length - 1].amount || 0) : 0;
    if (dbEnabled) {
      const { data: mintRows, error: mintError } = await supabase
        .from('dopel_transactions')
        .select('amount')
        .eq('type', 'Mint');
      if (mintError) throw mintError;
      dopelSupply = (mintRows || []).reduce((sum, row) => sum + Number(row.amount), 0);

      const { data: blockRows, error: blockError } = await supabase
        .from('dopel_blocks')
        .select('block_number')
        .order('block_number', { ascending: false })
        .limit(1);
      if (blockError) throw blockError;
      blockHeight = Number(blockRows?.[0]?.block_number || 0);

      const { data: sumRows, error: sumErr } = await supabase
        .from('validator_rewards')
        .select('amount');
      if (sumErr) throw sumErr;
      totalRewards = (sumRows || []).reduce((s, r) => s + Number(r.amount), 0);
      const { data: lastReward, error: lastErr } = await supabase
        .from('validator_rewards')
        .select('amount')
        .order('id', { ascending: false })
        .limit(1);
      if (lastErr) throw lastErr;
      rewardPerBlock = Number(lastReward?.[0]?.amount || 0);
    }

    res.json({
      dopelSupply,
      epoch: 851,
      blockHeight,
      tps: 892,
      tpsHistory: [750, 800, 900, 1000, 850],
      totalRewards,
      rewardPerBlock,
    });
  } catch (e) {
    console.error('GET /api/stats error:', e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/tokens', (req, res) => {
  res.json([
    { name: 'Dopel', symbol: 'DOP', price: 0.03 },
    { name: 'GhostFi', symbol: 'GFI', price: 0.10 }
  ]);
});

app.get('/api/defi', (req, res) => {
  res.json([
    { name: 'DopelSwap', volume: 1123456 },
    { name: 'GhostLend', volume: 89324 }
  ]);
});

app.get('/api/transactions', async (req, res) => {
  try {
    if (!dbEnabled) {
      const txs = memoryTransactions.slice(-20).reverse().map((tx) => ({
        ...tx,
        time: new Date(Number(tx.timestamp)).toISOString(),
      }));
      return res.json(txs);
    }
    const { data, error } = await supabase
      .from('dopel_transactions')
      .select('signature, type, amount, from_addr, to_addr, timestamp')
      .order('id', { ascending: false })
      .limit(20);
    if (error) throw error;
    const txs = (data || []).map((tx) => ({
      signature: tx.signature,
      type: tx.type,
      amount: Number(tx.amount),
      from: tx.from_addr,
      to: tx.to_addr,
      time: new Date(Number(tx.timestamp)).toISOString(),
    }));
    res.json(txs);
  } catch (e) {
    console.error('GET /api/transactions error:', e);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Indexer API running on port ${PORT}`);
});

async function main() {
    console.log("Listening for DopelgangaChain events...");

    // Initialize next block number
    if (dbEnabled) {
      try {
        const { data: latest, error } = await supabase
          .from('dopel_blocks')
          .select('block_number')
          .order('block_number', { ascending: false })
          .limit(1);
        if (error) throw error;
        blockNumber = Number(latest?.[0]?.block_number || 0) + 1;
        health.lastBlockNumber = blockNumber - 1;
        health.dbOk = true;
      } catch (e) {
        console.warn('Could not fetch latest block_number, defaulting to 1');
        blockNumber = 1;
        health.dbOk = false;
      }
    } else {
      blockNumber = 1;
      health.dbOk = false;
    }

    // Ping RPC once
    try {
      await connection.getVersion();
      health.rpcOk = true;
    } catch (e) {
      console.warn('RPC ping failed:', e?.message || e);
      health.rpcOk = false;
    }

    // Subscribe to logs
    connection.onLogs(PROGRAM_ID, async (logInfo) => {
        const logs = logInfo.logs || [];
        const matches = logs.filter(log => log.includes("Program log:"));
        if (matches.length === 0) return;

        const timestamp = Date.now();
        const rawEvents = matches.map(log => log.replace("Program log:", "").trim());
        const events = rawEvents.map((msg) => {
          try {
            return JSON.parse(msg);
          } catch {
            return { type: (msg.split(':')[0] || 'Unknown'), msg };
          }
        });

        // De-duplication: if we have already seen this signature, skip
        const sigPrefix = `${logInfo.signature}-`;
        try {
          const { data: existsRows, error: existsErr } = await supabase
            .from('dopel_transactions')
            .select('id')
            .like('signature', `${sigPrefix}%`)
            .limit(1);
          if (existsErr) throw existsErr;
          if ((existsRows || []).length > 0) {
            // Already processed this signature
            return;
          }
        } catch (e) {
          console.warn('Dedup check failed, proceeding defensively:', e?.message || e);
        }

        const currentBlockNumber = blockNumber++;
        const newBlock = { blockNumber: currentBlockNumber, timestamp, events };
        layerBlocks.push(newBlock);

        // Persist block
        if (dbEnabled) {
          try {
            const { error: blockErr } = await supabase
              .from('dopel_blocks')
              .insert([{ block_number: currentBlockNumber, timestamp, events }]);
            if (blockErr) throw blockErr;
            health.lastBlockNumber = currentBlockNumber;
          } catch (e) {
            console.error('Failed to insert block:', e);
          }
        }

        // Persist transactions (best effort based on events) and validator rewards
        try {
          const txRows = events.map((ev, i) => ({
            signature: `${logInfo.signature}-${i}`,
            type: (ev && ev.type) ? String(ev.type) : 'Unknown',
            amount: Number(ev?.amount || 0),
            from_addr: ev?.from || null,
            to_addr: ev?.to || null,
            timestamp,
          }));
          if (txRows.length > 0) {
            if (dbEnabled) {
              const { error: txErr } = await supabase
                .from('dopel_transactions')
                .insert(txRows);
              if (txErr) throw txErr;
            } else {
              memoryTransactions.push(
                ...txRows.map((t) => ({
                  signature: t.signature,
                  type: t.type,
                  amount: t.amount,
                  from: t.from_addr,
                  to: t.to_addr,
                  timestamp: t.timestamp,
                }))
              );
            }
          }
          // Insert validator rewards if present
          const rewardRows = events
            .filter((ev) => ev?.event === 'ValidatorReward' || ev?.type === 'ValidatorReward')
            .map((ev) => ({
              block: Number(ev?.block ?? 0),
              validator: String(ev?.validator ?? ''),
              amount: Number(ev?.amount ?? 0),
              // On-chain timestamp is seconds; prefer that if available
              timestamp: Number(ev?.timestamp ?? Math.floor(timestamp / 1000)),
            }))
            .filter((r) => r.validator && r.amount > 0);
          if (rewardRows.length > 0) {
            if (dbEnabled) {
              const { error: rewErr } = await supabase
                .from('validator_rewards')
                .insert(rewardRows);
              if (rewErr) throw rewErr;
            } else {
              memoryValidatorRewards.push(...rewardRows);
            }
          }
          health.lastSignature = logInfo.signature;
          health.lastInsertTs = Date.now();
        } catch (e) {
          console.error('Failed to insert transactions:', e);
        }

        console.log("📦 New DopelgangaBlock:", {
          blockNumber: currentBlockNumber,
          timestamp,
          events: events.length,
          sig: logInfo.signature,
        });
    }, "confirmed");
    health.subscribed = true;
}

main().catch(console.error);

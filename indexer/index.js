
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const connection = new Connection('https://api.mainnet-beta.solana.com');

let blockNumber = 1;
const layerBlocks = [];


// Start Express server
const app = express();
app.use(cors());
app.use(express.json());

// --- API ENDPOINTS ---

// List recent blocks (most recent first)
app.get('/blocks', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const blocks = layerBlocks.slice(-limit).reverse();
  res.json({ blocks });
});

// Get block by blockNumber (with mock tx details)
app.get('/blocks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const block = layerBlocks.find(b => b.blockNumber === id);
  if (!block) return res.status(404).json({ error: 'Block not found' });
  // For demo, parse events into txs
  const events = (block.events || []).map((e, i) => ({
    type: e.split(':')[0] || 'Unknown',
    from: 'UserA',
    to: 'UserB',
    amount: Math.floor(Math.random() * 1000),
    signature: `TxSig${block.blockNumber}_${i}`
  }));
  res.json({ ...block, events });
});

// --- Explorer API ---
app.get('/api/stats', (req, res) => {
  res.json({
    dopelSupply: 7000000000,
    epoch: 851,
    blockHeight: layerBlocks.length,
    tps: 892,
    tpsHistory: [750, 800, 900, 1000, 850]
  });
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

app.get('/api/transactions', (req, res) => {
  // For demo, flatten all block events as txs
  const txs = layerBlocks.flatMap((block) =>
    (block.events || []).map((e, i) => ({
      signature: `TxSig${block.blockNumber}_${i}`,
      type: e.split(':')[0] || 'Unknown',
      amount: Math.floor(Math.random() * 1000),
      time: new Date(block.timestamp).toISOString()
    }))
  ).slice(-20).reverse();
  res.json(txs);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Indexer API running on port ${PORT}`);
});

async function main() {
    console.log("Listening for DopelgangaChain events...");

    connection.onLogs(PROGRAM_ID, (logInfo) => {
        const logs = logInfo.logs;
        const matches = logs.filter(log => log.includes("Program log:"));
        if (matches.length > 0) {
            const timestamp = Date.now();
            const events = matches.map(log => log.replace("Program log:", "").trim());
            const newBlock = {
                blockNumber: blockNumber++,
                timestamp,
                events
            };
            layerBlocks.push(newBlock);
            console.log("📦 New DopelgangaBlock:", newBlock);
        }
    }, "confirmed");
}

main().catch(console.error);

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

// List recent blocks (most recent first)
app.get('/blocks', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const blocks = layerBlocks.slice(-limit).reverse();
  res.json({ blocks });
});

// Get block by blockNumber
app.get('/blocks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const block = layerBlocks.find(b => b.blockNumber === id);
  if (!block) return res.status(404).json({ error: 'Block not found' });
  res.json(block);
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
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const connection = new Connection('https://api.mainnet-beta.solana.com');

let blockNumber = 1;
const layerBlocks = [];

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
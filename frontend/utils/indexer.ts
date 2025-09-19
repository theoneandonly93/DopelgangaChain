
import { Connection, PublicKey } from "@solana/web3.js";
import db from "./db";
import { runMigrations } from "./migrate";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP"
);
const RPC_URL =
  process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

let blockNumber = 0;


if (typeof window === "undefined") {
  (async () => {
    await runMigrations(); // Ensure DB schema exists
    console.log("🚀 DopelgangaChain Indexer starting...");
    await startIndexer();
  })();
}

async function startIndexer() {
  const connection = new Connection(RPC_URL, "confirmed");

  connection.onLogs(PROGRAM_ID, async (logInfo) => {
    try {
      blockNumber++;

      const timestamp = Date.now();
      const signature = logInfo.signature;

      // Parse event logs
      const events: any[] = [];
      logInfo.logs.forEach((line) => {
        if (line.includes("Program log:")) {
          const msg = line.replace("Program log:", "").trim();
          try {
            const parsed = JSON.parse(msg); // If you emit JSON logs
            events.push(parsed);
          } catch {
            events.push({ raw: msg }); // fallback
          }
        }
      });

      // Insert block
      await db.query(
        "INSERT INTO dopel_blocks (block_number, timestamp, events) VALUES ($1,$2,$3)",
        [blockNumber, timestamp, JSON.stringify(events)]
      );

      // Insert transactions (simplified example)
      for (const ev of events) {
        if (ev.type === "Transfer") {
          await db.query(
            `INSERT INTO dopel_transactions (signature, type, amount, from_addr, to_addr, timestamp)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              signature,
              "Transfer",
              ev.amount || 0,
              ev.from || null,
              ev.to || null,
              timestamp,
            ]
          );
        }
        if (ev.type === "MintDopel") {
          await db.query(
            `INSERT INTO dopel_transactions (signature, type, amount, from_addr, to_addr, timestamp)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              signature,
              "Mint",
              ev.amount || 0,
              null,
              ev.to || null,
              timestamp,
            ]
          );
        }
      }

      console.log(`✅ Block #${blockNumber} recorded with ${events.length} events`);
    } catch (err) {
      console.error("❌ Indexer error:", err);
    }
  });
}

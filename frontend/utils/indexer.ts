
import { Connection, PublicKey } from "@solana/web3.js";
import { runMigrations } from "./migrate";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP"
);
const RPC_URL =
  process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

let blockNumber = 0;


if (typeof window === "undefined") {
  (async () => {
  await runMigrations(); // Ensure DB schema exists (Supabase)
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
          } catch (e) {
            // ignore non-JSON logs
          }
        }
      });
      // TODO: Insert block and transactions into Supabase
      // Example:
      // await supabase.from('dopel_blocks').insert([{ block_number: blockNumber, timestamp, events }]);
      // for (const ev of events) { ... }
      console.log(`✅ Block #${blockNumber} parsed with ${events.length} events`);
    } catch (err) {
      console.error("❌ Indexer error:", err);
    }
  });
}

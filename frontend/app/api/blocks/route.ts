import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // TODO: Replace with DB/indexer logic
    const blocks = [
      {
        blockNumber: 1000,
        timestamp: Date.now(),
        events: [{ type: "Transfer", from: "A", to: "B", amount: 50 }],
      },
      {
        blockNumber: 999,
        timestamp: Date.now() - 6000,
        events: [{ type: "Mint", to: "C", amount: 100 }],
      },
    ].slice(0, limit);

    return NextResponse.json(blocks);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 });
  }
}

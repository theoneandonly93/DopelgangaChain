import { NextResponse } from "next/server";
import db from "@/utils/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const result = await db.query(
      "SELECT * FROM dopel_blocks ORDER BY block_number DESC LIMIT $1",
      [limit]
    );
    // Parse events JSON
    const blocks = result.rows.map((row: any) => ({
      ...row,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events
    }));
    return NextResponse.json(blocks);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 });
  }
}

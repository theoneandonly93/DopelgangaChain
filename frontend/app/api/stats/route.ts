import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    dopelSupply: 7_000_000_000,
    epoch: 851,
    blockHeight: 1000,
    tps: 892,
    tpsHistory: [750, 800, 900, 1000, 850],
  });
}

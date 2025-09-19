import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      signature: "5tr9x6...abc",
      type: "Transfer",
      amount: 2000,
      time: new Date().toISOString(),
    },
    {
      signature: "F3n8k2...xyz",
      type: "ReferralReward",
      amount: 500,
      time: new Date().toISOString(),
    },
  ]);
}

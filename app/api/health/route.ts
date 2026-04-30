import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET",
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    contract: Boolean(process.env.NEXT_PUBLIC_CONTRACT_ID),
  });
}
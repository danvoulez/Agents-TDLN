import { NextRequest, NextResponse } from "next/server";

const ATOMIC_API_URL = process.env.ATOMIC_API_URL!;

export async function POST(req: NextRequest) {
  if (!ATOMIC_API_URL) {
    return NextResponse.json({ error: "ATOMIC_API_URL is not configured" }, { status: 500 });
  }
  const body = await req.json();
  const upstreamRes = await fetch(`${ATOMIC_API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await upstreamRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstreamRes.status });
}

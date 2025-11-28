import { NextRequest, NextResponse } from "next/server";
const ATOMIC_API_URL = process.env.ATOMIC_API_URL!;
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!ATOMIC_API_URL) return NextResponse.json({ error: "ATOMIC_API_URL not configured" }, { status: 500 });
  const upstream = await fetch(`${ATOMIC_API_URL}/api/jobs/${params.id}/approve`, { method: "POST" });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

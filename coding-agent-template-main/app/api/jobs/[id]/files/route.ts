import { NextRequest, NextResponse } from "next/server";

const ATOMIC_API_URL = process.env.ATOMIC_API_URL!;

interface RouteContext { params: { id: string } }

export async function GET(req: NextRequest, context: RouteContext) {
  if (!ATOMIC_API_URL) return new NextResponse("ATOMIC_API_URL not configured", { status: 500 });
  const jobId = context.params.id;
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";
  const upstreamUrl = `${ATOMIC_API_URL}/api/jobs/${encodeURIComponent(jobId)}/files?path=${encodeURIComponent(path)}`;
  const upstreamRes = await fetch(upstreamUrl);
  const text = await upstreamRes.text();
  return new NextResponse(text, { status: upstreamRes.status, headers: { "Content-Type": upstreamRes.headers.get("Content-Type") || "application/json" } });
}

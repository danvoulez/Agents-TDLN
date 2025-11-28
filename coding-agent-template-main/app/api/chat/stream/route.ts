import { NextRequest } from "next/server";

const ATOMIC_API_URL = process.env.ATOMIC_API_URL!;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!ATOMIC_API_URL) {
    return new Response("ATOMIC_API_URL not configured", { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return new Response("Missing conversationId", { status: 400 });

  const upstreamUrl = `${ATOMIC_API_URL}/api/chat/stream?conversationId=${encodeURIComponent(conversationId)}`;
  const upstreamRes = await fetch(upstreamUrl, { headers: { Accept: "text/event-stream" }, /*@ts-ignore*/ signal: (req as any).signal });
  if (!upstreamRes.ok || !upstreamRes.body) return new Response("Failed to connect to upstream stream", { status: 502 });

  const stream = new ReadableStream({
    start(controller) {
      const reader = upstreamRes.body!.getReader();
      const pump = (): any => reader.read().then(({ done, value }) => {
        if (done) return controller.close();
        controller.enqueue(value);
        return pump();
      });
      pump().catch((err: any) => controller.error(err));
    },
    cancel() { /*@ts-ignore*/ upstreamRes.body?.cancel?.(); }
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
}

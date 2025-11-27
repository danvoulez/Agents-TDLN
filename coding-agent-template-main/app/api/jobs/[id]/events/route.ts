import { NextRequest } from "next/server";

const ATOMIC_API_URL = process.env.ATOMIC_API_URL!;
export const runtime = "nodejs";

interface RouteContext { params: { id: string } }

export async function GET(req: NextRequest, context: RouteContext) {
  if (!ATOMIC_API_URL) return new Response("ATOMIC_API_URL not configured", { status: 500 });
  const jobId = context.params.id;
  const upstreamUrl = `${ATOMIC_API_URL}/api/jobs/${encodeURIComponent(jobId)}/events`;
  const upstreamRes = await fetch(upstreamUrl, { headers: { Accept: "text/event-stream" }, /*@ts-ignore*/ signal: (req as any).signal });
  if (!upstreamRes.ok || !upstreamRes.body) return new Response("Failed to connect to upstream job events", { status: 502 });

  const stream = new ReadableStream({
    start(controller) {
      const reader = upstreamRes.body!.getReader();
      const pump = (): any => reader.read().then(({ done, value }) => {
        if (done) return controller.close();
        controller.enqueue(value);
        return pump();
      });
      pump().catch(err => controller.error(err));
    },
    cancel() { /*@ts-ignore*/ upstreamRes.body?.cancel?.(); }
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
}

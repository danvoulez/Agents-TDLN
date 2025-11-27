import { NextRequest } from "next/server";
import { getJob, getEventBus } from "@ai-coding-team/db";

interface RouteParams { params: { id: string } }

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: RouteParams) {
  const jobId = params.id;
  const job = await getJob(jobId);
  if (!job) return new Response("Not found", { status: 404 });

  const bus = getEventBus();
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (type: string, payload: any) => {
        const s = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(s));
      };
      const handler = (evt: any) => {
        if (evt.jobId === jobId) {
          send(evt.type || "event", evt);
        }
      };
      bus.on("job_event", handler);
      // heartbeat
      const hb = setInterval(() => controller.enqueue(encoder.encode(": ping\n\n")), 20000);

      // initial state could be sent here if desired

      // cleanup
      // @ts-ignore
      controller.signal?.addEventListener?.("abort", () => {
        clearInterval(hb);
        bus.off("job_event", handler);
      });
    }
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
}

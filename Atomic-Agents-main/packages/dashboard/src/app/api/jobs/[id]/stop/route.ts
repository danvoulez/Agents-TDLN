import { NextRequest } from "next/server";
import { getJob, requestJobCancel, appendEventToLedger } from "@ai-coding-team/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const job = await getJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  await requestJobCancel(id);
  await appendEventToLedger({
    job_id: id, kind: "info", summary: "Job cancelled by user", tool_name: "control", params: null, result: null
  } as any);
  return Response.json({ ok: true, jobId: id, status: "cancelling" });
}

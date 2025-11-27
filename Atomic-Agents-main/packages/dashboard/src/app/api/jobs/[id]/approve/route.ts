import { NextRequest } from "next/server";
import { getJob, updateJob, appendEventToLedger } from "@ai-coding-team/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const job = await getJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  await updateJob(id, { status: "succeeded" } as any);
  await appendEventToLedger({
    job_id: id, kind: "success", summary: "Job approved by user", tool_name: "control", params: null, result: null
  } as any);
  return Response.json({ ok: true, jobId: id, status: "succeeded" });
}

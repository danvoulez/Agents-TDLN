import { NextRequest } from "next/server";
import { getJob } from "@ai-coding-team/db";
import * as fs from "fs/promises";
import * as path from "path";

interface RouteParams { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const relPath = searchParams.get("path") || "";
  const job = await getJob(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  // repoPath camelCase from AgentJob, fall back to snake
  const repoPath = (job as any).repo_path ?? (job as any).repoPath;
  if (!repoPath) {
    return Response.json({ error: "Job has no repo path" }, { status: 400 });
  }

  // normalize and prevent path traversal
  const safeRoot = path.resolve(String(repoPath));
  const target = path.resolve(safeRoot, "." + (relPath.startsWith("/") ? relPath : "/" + relPath));
  if (!target.startsWith(safeRoot)) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const content = await fs.readFile(target, "utf-8");
    return Response.json({ path: relPath, content });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Read failed" }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { addDeployment, addIteration, getIterations, getProject, saveRepo } from "../src/lib/db";

export async function GET() {
  const project = getProject() as { id: number };
  return NextResponse.json({ project, iterations: getIterations(project.id) });
}

export async function POST(request: Request) {
  const body = await request.json() as { action?: string; text?: string; repo?: string; token?: string };
  const project = getProject() as { id: number; repo: string };
  if (body.action === "iterate" && body.text?.trim()) {
    return NextResponse.json({ iteration: addIteration(project.id, body.text.trim()) });
  }
  if (body.action === "connect" && body.repo?.trim()) {
    const repo = body.repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (body.token) {
      const response = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Authorization: `Bearer ${body.token}`, Accept: "application/vnd.github+json" } });
      if (!response.ok) return NextResponse.json({ error: "无法验证这个仓库，请检查 Token 和仓库权限。" }, { status: 400 });
    }
    return NextResponse.json({ project: saveRepo(project.id, repo) });
  }
  if (body.action === "publish" && project.repo) {
    const url = `https://${project.repo.split("/")[0]}.github.io/${project.repo.split("/")[1]}/`;
    addDeployment(project.id, project.repo, url, "queued");
    return NextResponse.json({ url, status: "queued" });
  }
  return NextResponse.json({ error: "请求参数不完整。" }, { status: 400 });
}

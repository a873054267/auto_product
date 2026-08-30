import cors from "cors";
import express from "express";
import { addDeployment, addIteration, getIterations, getProject, saveRepo } from "../src/lib/db";

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/workspace", (_request, response) => {
  const project = getProject() as { id: number };
  response.json({ project, iterations: getIterations(project.id) });
});

app.post("/api/workspace", async (request, response) => {
  const body = request.body as { action?: string; text?: string; repo?: string; token?: string };
  const project = getProject() as { id: number; repo: string };
  if (body.action === "iterate" && body.text?.trim()) {
    return response.json({ iteration: addIteration(project.id, body.text.trim()) });
  }
  if (body.action === "connect" && body.repo?.trim()) {
    const repo = body.repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (body.token) {
      const githubResponse = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Authorization: `Bearer ${body.token}`, Accept: "application/vnd.github+json" } });
      if (!githubResponse.ok) return response.status(400).json({ error: "无法验证这个仓库，请检查 Token 和仓库权限。" });
    }
    return response.json({ project: saveRepo(project.id, repo) });
  }
  if (body.action === "publish" && project.repo) {
    const [owner, repository] = project.repo.split("/");
    const url = `https://${owner}.github.io/${repository}/`;
    addDeployment(project.id, project.repo, url, "queued");
    return response.json({ url, status: "queued" });
  }
  return response.status(400).json({ error: "请求参数不完整。" });
});

app.listen(port, "0.0.0.0", () => console.log(`Forgeboard API listening on port ${port}`));

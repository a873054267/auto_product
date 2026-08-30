"use client";

import { FormEvent, useEffect, useState } from "react";
import { Iteration, Project, seedIterations, workspaceApiUrl } from "@/lib/workspace";

const navigation = ["Overview", "Iterations", "Deployments"];
const navigationIcons = ["○", "↗", "□"];

export default function WorkspaceClient() {
  const [project, setProject] = useState<Project>({ id: 1, name: "Orbit landing page", repo: "" });
  const [iterations, setIterations] = useState<Iteration[]>(seedIterations);
  const [request, setRequest] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState("");
  const [active, setActive] = useState("Overview");

  useEffect(() => {
    fetch(workspaceApiUrl("/api/workspace"))
      .then((response) => response.json())
      .then((data) => { setProject(data.project); if (data.iterations.length) setIterations(data.iterations); })
      .catch(() => setNotice("后台 API 暂时无法访问，请检查 NEXT_PUBLIC_API_BASE_URL。"));
  }, []);

  async function submitIteration(event: FormEvent) {
    event.preventDefault();
    if (!request.trim()) return;
    const response = await fetch(workspaceApiUrl("/api/workspace"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "iterate", text: request }) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || "需求提交失败。"); return; }
    setIterations((current) => [data.iteration, ...current]); setRequest(""); setNotice("Iteration complete. Your product brief has been updated.");
  }

  async function connectRepo(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(workspaceApiUrl("/api/workspace"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "connect", repo, token }) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error); return; }
    setProject(data.project); setRepo(data.project.repo); setToken(""); setNotice("GitHub repository connected.");
  }

  async function publish() {
    const response = await fetch(workspaceApiUrl("/api/workspace"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
    const data = await response.json(); setNotice(data.url ? `Publish queued: ${data.url}` : data.error);
  }

  return <>
    <header className="topbar"><div className="brand"><span className="brand-mark">✦</span> forgeboard</div><div className="top-actions"><span>Workspace / {project.name}</span><span className="avatar">JS</span></div></header>
    <div className="layout">
      <aside className="sidebar"><div className="eyebrow">Project</div><div className="project-name">{project.name}</div><nav className="nav">{navigation.map((item, index) => <button className={active === item ? "active" : ""} onClick={() => setActive(item)} key={item}><span className="nav-icon">{navigationIcons[index]}</span>{item}</button>)}</nav><div className="sidebar-footer">Last synced<br /><strong>just now</strong><br /><br />Built for fast-moving teams.</div></aside>
      <main className="main"><div className="main-heading"><div><div className="eyebrow">{active} / product loop</div><h1>Shape it.<br /><em>Ship it.</em></h1><p className="lede">Turn a rough idea into something real, one clear iteration at a time.</p></div><span className="pill">● Live workspace</span></div>
        <form className="input-bar" onSubmit={submitIteration}><div className="input-wrap"><label htmlFor="request">What should we improve next?</label><textarea id="request" rows={2} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="e.g. Make the onboarding flow feel more personal..." /></div><button className="primary" type="submit">Run iteration ↗</button></form>
        {notice && <div className="notice">{notice}</div>}
        <div className="section-head"><h2 className="section-title">Iteration history</h2><span className="count">{iterations.length} iterations</span></div><div className="timeline">{iterations.map((item, index) => <article className={`iteration ${index === 0 ? "current" : ""}`} key={item.id}><div className="iteration-top"><span>{index === 0 ? "Current iteration" : `Iteration ${iterations.length - index}`}</span><span>{item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "May 24"}</span></div><h3>{item.request}</h3><p><span className="tag">Done</span> &nbsp;{item.summary}</p></article>)}</div>
      </main>
      <aside className="rightbar"><div><div className="eyebrow">Integrations</div><h2>Connect your tools</h2><form className="connection" onSubmit={connectRepo}><div className="connection-row"><span className="github">●</span><span>GitHub repository</span></div><div className="status">{project.repo ? `Connected · ${project.repo}` : "Not connected"}</div><label htmlFor="repo" style={{ marginTop: 20 }}>Repository</label><input id="repo" value={repo || project.repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repository" /><label htmlFor="token" style={{ marginTop: 12 }}>Personal access token</label><input id="token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Optional for public repos" /><button className="primary" style={{ marginTop: 14, width: "100%" }} type="submit">{project.repo ? "Update connection" : "Connect GitHub"}</button></form></div><div className="repo-block"><div className="eyebrow">Repository</div>{project.repo ? <a className="repo-link" href={`https://github.com/${project.repo}`} target="_blank">github.com/{project.repo} ↗</a> : <span className="repo-link" style={{ color: "var(--muted)" }}>Connect a repo to begin</span>}</div><div className="publish-card"><div className="eyebrow">Ready to go live?</div><h3>Publish your page</h3><p>Push the latest iteration to GitHub Pages and share it with the world.</p><button onClick={publish}>Publish to GitHub Pages ↗</button></div></aside>
    </div>
  </>;
}

import Database from "better-sqlite3";
import path from "node:path";

const database = new Database(process.env.DATABASE_PATH || path.join(process.cwd(), "forgeboard.db"));
database.pragma("journal_mode = WAL");
database.exec(`
  CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, repo TEXT, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS iterations (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, request TEXT NOT NULL, summary TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS deployments (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, repo TEXT NOT NULL, url TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL);
`);

export function getProject() {
  let project = database.prepare("SELECT * FROM projects ORDER BY id LIMIT 1").get() as Record<string, unknown> | undefined;
  if (!project) {
    const result = database.prepare("INSERT INTO projects (name, repo, created_at) VALUES (?, ?, ?)").run("Orbit landing page", "", new Date().toISOString());
    project = database.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  }
  return project;
}

export function getIterations(projectId: number) {
  return database.prepare("SELECT * FROM iterations WHERE project_id = ? ORDER BY id DESC").all(projectId);
}

export function addIteration(projectId: number, request: string) {
  const summary = request.length > 70 ? `${request.slice(0, 70)}...` : request;
  const result = database.prepare("INSERT INTO iterations (project_id, request, summary, status, created_at) VALUES (?, ?, ?, ?, ?)").run(projectId, request, summary, "processing", new Date().toISOString());
  database.prepare("UPDATE iterations SET status = 'complete' WHERE id = ?").run(result.lastInsertRowid);
  return database.prepare("SELECT * FROM iterations WHERE id = ?").get(result.lastInsertRowid);
}

export function saveRepo(projectId: number, repo: string) {
  database.prepare("UPDATE projects SET repo = ? WHERE id = ?").run(repo, projectId);
  return getProject();
}

export function addDeployment(projectId: number, repo: string, url: string, status: string) {
  database.prepare("INSERT INTO deployments (project_id, repo, url, status, created_at) VALUES (?, ?, ?, ?, ?)").run(projectId, repo, url, status, new Date().toISOString());
}

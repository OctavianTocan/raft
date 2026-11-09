import { Database } from "bun:sqlite";
import type { PullRequest, PRDetails, PRPanelData } from "./types";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";

// Initialize database in ~/.config/raft/raft.sqlite
const configDir = join(homedir(), ".config", "raft");
mkdirSync(configDir, { recursive: true });

const dbPath = join(configDir, "raft.sqlite");
export const db = new Database(dbPath);

db.run(`
  CREATE TABLE IF NOT EXISTS pull_requests (
    url TEXT PRIMARY KEY,
    data JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pr_details (
    url TEXT PRIMARY KEY,
    data JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pr_panel_data (
    url TEXT PRIMARY KEY,
    data JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS generated_fixes (
    id TEXT PRIMARY KEY,
    pr_url TEXT NOT NULL,
    thread_id TEXT,
    data JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function getGeneratedFixes(prUrl: string): any[] {
  const query = db.query(`SELECT data FROM generated_fixes WHERE pr_url = ?`);
  return query.all(prUrl).map((row: any) => JSON.parse(row.data));
}

export function cacheGeneratedFix(prUrl: string, threadId: string | null, fix: any) {
  const id = `${prUrl}::${threadId || "ci"}`;
  const insert = db.prepare(`
    INSERT OR REPLACE INTO generated_fixes (id, pr_url, thread_id, data, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  insert.run(id, prUrl, threadId, JSON.stringify(fix));
}

export function clearGeneratedFix(prUrl: string, threadId: string | null) {
  const id = `${prUrl}::${threadId || "ci"}`;
  const del = db.prepare(`DELETE FROM generated_fixes WHERE id = ?`);
  del.run(id);
}

export function getCachedPRs(): PullRequest[] {
  const query = db.query(`SELECT data FROM pull_requests`);
  return query.all().map((row: any) => JSON.parse(row.data));
}

export function cachePRs(prs: PullRequest[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO pull_requests (url, data, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  
  db.transaction(() => {
    // We clear old PRs to ensure we don't keep ones that were closed/merged
    // This could be optimized later to sync rather than drop
    db.run("DELETE FROM pull_requests");
    for (const pr of prs) {
      insert.run(pr.url, JSON.stringify(pr));
    }
  })();
}

export function getCachedPRDetails(url: string): PRDetails | null {
  const query = db.query(`SELECT data FROM pr_details WHERE url = ?`);
  const row = query.get(url) as any;
  if (!row) return null;
  return JSON.parse(row.data);
}

export function cachePRDetails(url: string, details: PRDetails) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO pr_details (url, data, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  insert.run(url, JSON.stringify(details));
}

export function getCachedPRPanelData(url: string): PRPanelData | null {
  const query = db.query(`SELECT data FROM pr_panel_data WHERE url = ?`);
  const row = query.get(url) as any;
  if (!row) return null;
  return JSON.parse(row.data);
}

export function cachePRPanelData(url: string, panelData: PRPanelData) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO pr_panel_data (url, data, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  insert.run(url, JSON.stringify(panelData));
}

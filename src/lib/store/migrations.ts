import type Database from "better-sqlite3";

export const SCHEMA_VERSION = 1;

export function applyMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      seeded INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS nodes (
      workspace_id TEXT NOT NULL,
      id TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      status TEXT,
      priority INTEGER,
      metadata_json TEXT NOT NULL,
      due_at TEXT,
      context_node_ids_json TEXT,
      suggested_actions_json TEXT,
      risk_entity_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS edges (
      workspace_id TEXT NOT NULL,
      id TEXT NOT NULL,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      kind TEXT NOT NULL,
      weight REAL NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS runs (
      workspace_id TEXT NOT NULL,
      id TEXT NOT NULL,
      loop_id TEXT NOT NULL,
      status TEXT NOT NULL,
      idempotency_key TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (workspace_id, id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_runs_idempotency
      ON runs(workspace_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL;

    -- At most one queued/running run per loop per workspace
    CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_run_per_loop
      ON runs(workspace_id, loop_id)
      WHERE status IN ('queued', 'running');

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'execute_run',
      status TEXT NOT NULL,
      lease_owner TEXT,
      lease_expires_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_pending
      ON jobs(status, lease_expires_at);

    CREATE TABLE IF NOT EXISTS risk_entities (
      workspace_id TEXT NOT NULL,
      id TEXT NOT NULL,
      label TEXT NOT NULL,
      dollars INTEGER NOT NULL,
      source_node_id TEXT,
      PRIMARY KEY (workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS watchdogs (
      workspace_id TEXT NOT NULL,
      id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      last_fired_at TEXT,
      fire_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS workspace_meta (
      workspace_id TEXT PRIMARY KEY,
      debt_baseline REAL NOT NULL DEFAULT 0,
      dollars_freed_lifetime REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  const row = db.prepare("SELECT value FROM schema_meta WHERE key = 'version'").get() as
    | { value: string }
    | undefined;
  if (!row) {
    db.prepare(
      "INSERT INTO schema_meta (key, value) VALUES ('version', ?)",
    ).run(String(SCHEMA_VERSION));
  }
}

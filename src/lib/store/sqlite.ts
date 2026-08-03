import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { applyMigrations } from "./migrations";

export class DatastoreCorruptError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "DatastoreCorruptError";
    if (options?.cause) (this as Error & { cause?: unknown }).cause = options.cause;
  }
}

const globalForDb = globalThis as unknown as {
  __continuumSqlite?: Database.Database;
  __continuumSqlitePath?: string;
};

function resolveDbPath(): string {
  if (process.env.CONTINUUM_DB_PATH) return path.resolve(process.env.CONTINUUM_DB_PATH);
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    return path.resolve(process.env.DATABASE_URL.slice("file:".length));
  }
  // Vercel/serverless: /var/task is read-only; use /tmp (ephemeral per instance).
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "continuum.sqlite");
  }
  return path.join(process.cwd(), "data", "continuum.sqlite");
}

export function getDbPath() {
  return resolveDbPath();
}

/** Open (or reuse) SQLite in WAL mode. Never silently reseeds on corruption. */
export function getSqlite(): Database.Database {
  const dbPath = resolveDbPath();
  if (globalForDb.__continuumSqlite && globalForDb.__continuumSqlitePath === dbPath) {
    return globalForDb.__continuumSqlite;
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  let db: Database.Database;
  try {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("foreign_keys = ON");
    applyMigrations(db);
    // Integrity check — fail closed, do not wipe/reseed
    const integrity = db.pragma("integrity_check") as { integrity_check: string }[];
    const ok = integrity?.[0]?.integrity_check === "ok";
    if (!ok) {
      db.close();
      throw new DatastoreCorruptError(
        `SQLite integrity_check failed for ${dbPath}. Refusing to reseed. Restore from backup or delete the file intentionally via reset.`,
      );
    }
  } catch (err) {
    if (err instanceof DatastoreCorruptError) throw err;
    throw new DatastoreCorruptError(
      `Failed to open Continuum datastore at ${dbPath}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }

  globalForDb.__continuumSqlite = db;
  globalForDb.__continuumSqlitePath = dbPath;
  return db;
}

/** Test helper — close and forget cached connection. */
export function closeSqlite() {
  if (globalForDb.__continuumSqlite) {
    try {
      globalForDb.__continuumSqlite.close();
    } catch {
      /* ignore */
    }
    globalForDb.__continuumSqlite = undefined;
    globalForDb.__continuumSqlitePath = undefined;
  }
}

export function withTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getSqlite();
  const tx = db.transaction(fn);
  return tx(db);
}

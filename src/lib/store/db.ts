import { nanoid } from "nanoid";
import { computeDebtMetrics } from "../debt";
import { createSeedSnapshot, seedRiskEntities } from "../seed";
import { TagsSchema } from "../schemas";
import type {
  GraphSnapshot,
  MemoryEdge,
  MemoryNode,
  MotionRun,
  OpenLoop,
  RiskEntity,
  RunStatus,
  WatchdogRule,
} from "../types";
import { DatastoreCorruptError, getSqlite, withTransaction } from "./sqlite";

export { DatastoreCorruptError };

export class ConflictError extends Error {
  existingRun: MotionRun;
  constructor(message: string, existingRun: MotionRun) {
    super(message);
    this.name = "ConflictError";
    this.existingRun = existingRun;
  }
}

export class ValidationStoreError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.name = "ValidationStoreError";
    this.status = status;
  }
}

function parseTags(raw: string, context: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationStoreError(`Invalid tags JSON on ${context}`, 422);
  }
  const result = TagsSchema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationStoreError(
      `tags must be an array of strings (${context}): ${result.error.issues[0]?.message}`,
      422,
    );
  }
  return result.data;
}

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new DatastoreCorruptError(`Corrupt JSON in ${label}`, { cause: err });
  }
}

function ensureWorkspace(workspaceId: string) {
  const db = getSqlite();
  const existing = db.prepare("SELECT id, seeded FROM workspaces WHERE id = ?").get(workspaceId) as
    | { id: string; seeded: number }
    | undefined;
  if (!existing) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO workspaces (id, created_at, seeded) VALUES (?, ?, 0)").run(
      workspaceId,
      now,
    );
    db.prepare(
      "INSERT INTO workspace_meta (workspace_id, debt_baseline, dollars_freed_lifetime, updated_at) VALUES (?, 0, 0, ?)",
    ).run(workspaceId, now);
  }
}

function rowToNode(row: Record<string, unknown>): MemoryNode | OpenLoop {
  const tags = parseTags(String(row.tags_json), `node:${row.id}`);
  const metadata = parseJson<MemoryNode["metadata"]>(String(row.metadata_json), `node.metadata:${row.id}`);
  const base: MemoryNode = {
    id: String(row.id),
    kind: row.kind as MemoryNode["kind"],
    title: String(row.title),
    summary: String(row.summary),
    tags,
    metadata,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
  if (row.status) base.status = row.status as OpenLoop["status"];
  if (row.priority != null) base.priority = row.priority as OpenLoop["priority"];

  if (row.kind === "loop") {
    return {
      ...base,
      kind: "loop",
      status: (row.status as OpenLoop["status"]) ?? "open",
      priority: (row.priority as OpenLoop["priority"]) ?? 3,
      dueAt: row.due_at ? String(row.due_at) : undefined,
      contextNodeIds: row.context_node_ids_json
        ? parseJson<string[]>(String(row.context_node_ids_json), `loop.context:${row.id}`)
        : [],
      suggestedActions: row.suggested_actions_json
        ? parseJson<string[]>(String(row.suggested_actions_json), `loop.actions:${row.id}`)
        : [],
      riskEntityId: row.risk_entity_id ? String(row.risk_entity_id) : undefined,
    } satisfies OpenLoop;
  }
  return base;
}

function insertNode(workspaceId: string, node: MemoryNode | OpenLoop) {
  const db = getSqlite();
  const loop = node.kind === "loop" ? (node as OpenLoop) : null;
  db.prepare(
    `INSERT INTO nodes (
      workspace_id, id, kind, title, summary, tags_json, status, priority,
      metadata_json, due_at, context_node_ids_json, suggested_actions_json,
      risk_entity_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(workspace_id, id) DO UPDATE SET
      kind=excluded.kind, title=excluded.title, summary=excluded.summary,
      tags_json=excluded.tags_json, status=excluded.status, priority=excluded.priority,
      metadata_json=excluded.metadata_json, due_at=excluded.due_at,
      context_node_ids_json=excluded.context_node_ids_json,
      suggested_actions_json=excluded.suggested_actions_json,
      risk_entity_id=excluded.risk_entity_id, updated_at=excluded.updated_at`,
  ).run(
    workspaceId,
    node.id,
    node.kind,
    node.title,
    node.summary,
    JSON.stringify(node.tags ?? []),
    loop?.status ?? node.status ?? null,
    loop?.priority ?? node.priority ?? null,
    JSON.stringify(node.metadata ?? {}),
    loop?.dueAt ?? null,
    loop ? JSON.stringify(loop.contextNodeIds ?? []) : null,
    loop ? JSON.stringify(loop.suggestedActions ?? []) : null,
    loop?.riskEntityId ?? null,
    node.createdAt,
    node.updatedAt,
  );
}

function seedWorkspace(workspaceId: string) {
  withTransaction((db) => {
    const ws = db.prepare("SELECT seeded FROM workspaces WHERE id = ?").get(workspaceId) as
      | { seeded: number }
      | undefined;
    if (ws?.seeded) return;

    const seed = createSeedSnapshot();
    seed.debtBaseline = computeDebtMetrics(seed).score;
    const now = new Date().toISOString();

    for (const node of seed.nodes) insertNode(workspaceId, node);
    for (const edge of seed.edges) {
      db.prepare(
        `INSERT OR REPLACE INTO edges (workspace_id, id, source, target, kind, weight, label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        workspaceId,
        edge.id,
        edge.source,
        edge.target,
        edge.kind,
        edge.weight,
        edge.label ?? null,
        edge.createdAt,
      );
    }
    for (const risk of seedRiskEntities()) {
      db.prepare(
        `INSERT OR REPLACE INTO risk_entities (workspace_id, id, label, dollars, source_node_id)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(workspaceId, risk.id, risk.label, risk.dollars, risk.sourceNodeId ?? null);
    }
    for (const w of seed.watchdogs) {
      db.prepare(
        `INSERT OR REPLACE INTO watchdogs (workspace_id, id, name, description, enabled, last_fired_at, fire_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        workspaceId,
        w.id,
        w.name,
        w.description,
        w.enabled ? 1 : 0,
        w.lastFiredAt ?? null,
        w.fireCount,
      );
    }
    db.prepare(
      `INSERT INTO workspace_meta (workspace_id, debt_baseline, dollars_freed_lifetime, updated_at)
       VALUES (?, ?, 0, ?)
       ON CONFLICT(workspace_id) DO UPDATE SET debt_baseline=excluded.debt_baseline, updated_at=excluded.updated_at`,
    ).run(workspaceId, seed.debtBaseline, now);
    db.prepare("UPDATE workspaces SET seeded = 1 WHERE id = ?").run(workspaceId);
  });
}

export function ensureWorkspaceReady(workspaceId: string) {
  ensureWorkspace(workspaceId);
  const db = getSqlite();
  const ws = db.prepare("SELECT seeded FROM workspaces WHERE id = ?").get(workspaceId) as
    | { seeded: number }
    | undefined;
  if (!ws?.seeded) seedWorkspace(workspaceId);
}

export async function getSnapshot(workspaceId: string): Promise<GraphSnapshot> {
  ensureWorkspaceReady(workspaceId);
  const db = getSqlite();

  const nodeRows = db
    .prepare("SELECT * FROM nodes WHERE workspace_id = ?")
    .all(workspaceId) as Record<string, unknown>[];
  const nodes = nodeRows.map(rowToNode);
  const loops = nodes.filter((n): n is OpenLoop => n.kind === "loop");

  const edgeRows = db
    .prepare("SELECT * FROM edges WHERE workspace_id = ?")
    .all(workspaceId) as Record<string, unknown>[];
  const edges: MemoryEdge[] = edgeRows.map((r) => ({
    id: String(r.id),
    source: String(r.source),
    target: String(r.target),
    kind: r.kind as MemoryEdge["kind"],
    weight: Number(r.weight),
    label: r.label ? String(r.label) : undefined,
    createdAt: String(r.created_at),
  }));

  const runRows = db
    .prepare("SELECT payload_json FROM runs WHERE workspace_id = ? ORDER BY created_at DESC")
    .all(workspaceId) as { payload_json: string }[];
  const runs = runRows.map((r) => parseJson<MotionRun>(r.payload_json, "run"));

  const watchdogRows = db
    .prepare("SELECT * FROM watchdogs WHERE workspace_id = ?")
    .all(workspaceId) as Record<string, unknown>[];
  const watchdogs: WatchdogRule[] = watchdogRows.map((r) => ({
    id: r.id as WatchdogRule["id"],
    name: String(r.name),
    description: String(r.description),
    enabled: Boolean(r.enabled),
    lastFiredAt: r.last_fired_at ? String(r.last_fired_at) : undefined,
    fireCount: Number(r.fire_count),
  }));

  const riskRows = db
    .prepare("SELECT * FROM risk_entities WHERE workspace_id = ?")
    .all(workspaceId) as Record<string, unknown>[];
  const riskEntities: RiskEntity[] = riskRows.map((r) => ({
    id: String(r.id),
    label: String(r.label),
    dollars: Number(r.dollars),
    sourceNodeId: r.source_node_id ? String(r.source_node_id) : undefined,
  }));

  const meta = db
    .prepare("SELECT * FROM workspace_meta WHERE workspace_id = ?")
    .get(workspaceId) as
    | { debt_baseline: number; dollars_freed_lifetime: number; updated_at: string }
    | undefined;

  return {
    nodes,
    edges,
    loops,
    runs,
    watchdogs,
    riskEntities,
    debtBaseline: meta?.debt_baseline ?? 0,
    dollarsFreedLifetime: meta?.dollars_freed_lifetime ?? 0,
    updatedAt: meta?.updated_at ?? new Date().toISOString(),
  };
}

export async function resetSnapshot(workspaceId: string): Promise<GraphSnapshot> {
  ensureWorkspace(workspaceId);
  withTransaction((db) => {
    db.prepare("DELETE FROM nodes WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM edges WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM runs WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM jobs WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM risk_entities WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM watchdogs WHERE workspace_id = ?").run(workspaceId);
    db.prepare("UPDATE workspaces SET seeded = 0 WHERE id = ?").run(workspaceId);
  });
  seedWorkspace(workspaceId);
  return getSnapshot(workspaceId);
}

export async function upsertNode(workspaceId: string, node: MemoryNode | OpenLoop) {
  ensureWorkspaceReady(workspaceId);
  const tagsResult = TagsSchema.safeParse(node.tags);
  if (!tagsResult.success) {
    throw new ValidationStoreError("tags must be an array of strings", 422);
  }
  node.tags = tagsResult.data;
  withTransaction(() => {
    insertNode(workspaceId, node);
    touchMeta(workspaceId);
  });
  return getSnapshot(workspaceId);
}

export async function upsertEdge(workspaceId: string, edge: MemoryEdge) {
  ensureWorkspaceReady(workspaceId);
  withTransaction((db) => {
    db.prepare(
      `INSERT INTO edges (workspace_id, id, source, target, kind, weight, label, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(workspace_id, id) DO UPDATE SET
         source=excluded.source, target=excluded.target, kind=excluded.kind,
         weight=excluded.weight, label=excluded.label`,
    ).run(
      workspaceId,
      edge.id,
      edge.source,
      edge.target,
      edge.kind,
      edge.weight,
      edge.label ?? null,
      edge.createdAt,
    );
    touchMeta(workspaceId);
  });
  return getSnapshot(workspaceId);
}

export async function deleteNode(workspaceId: string, id: string) {
  ensureWorkspaceReady(workspaceId);
  withTransaction((db) => {
    db.prepare("DELETE FROM nodes WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
    db.prepare(
      "DELETE FROM edges WHERE workspace_id = ? AND (source = ? OR target = ?)",
    ).run(workspaceId, id, id);
    touchMeta(workspaceId);
  });
  return getSnapshot(workspaceId);
}

export async function updateLoop(workspaceId: string, id: string, patch: Partial<OpenLoop>) {
  ensureWorkspaceReady(workspaceId);
  const snap = await getSnapshot(workspaceId);
  const loop = snap.loops.find((l) => l.id === id);
  if (!loop) throw new Error("Loop not found");
  const next = { ...loop, ...patch, updatedAt: new Date().toISOString() } as OpenLoop;
  await upsertNode(workspaceId, next);
  return getSnapshot(workspaceId);
}

function touchMeta(workspaceId: string) {
  getSqlite()
    .prepare("UPDATE workspace_meta SET updated_at = ? WHERE workspace_id = ?")
    .run(new Date().toISOString(), workspaceId);
}

export async function saveRun(
  workspaceId: string,
  run: MotionRun,
  opts?: { idempotencyKey?: string | null },
) {
  ensureWorkspaceReady(workspaceId);
  const now = new Date().toISOString();
  withTransaction((db) => {
    const existing = db
      .prepare("SELECT id, status, payload_json FROM runs WHERE workspace_id = ? AND id = ?")
      .get(workspaceId, run.id) as { id: string; status: string; payload_json: string } | undefined;

    if (!existing) {
      try {
        db.prepare(
          `INSERT INTO runs (workspace_id, id, loop_id, status, idempotency_key, payload_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          workspaceId,
          run.id,
          run.loopId,
          run.status,
          opts?.idempotencyKey ?? run.idempotencyKey ?? null,
          JSON.stringify(run),
          run.startedAt || now,
          now,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("idx_one_active_run_per_loop") ||
          (msg.includes("UNIQUE constraint failed") && msg.includes("loop_id"))
        ) {
          const active = db
            .prepare(
              `SELECT payload_json FROM runs WHERE workspace_id = ? AND loop_id = ? AND status IN ('queued','running') LIMIT 1`,
            )
            .get(workspaceId, run.loopId) as { payload_json: string } | undefined;
          if (active) {
            throw new ConflictError(
              "Loop already has an active run",
              parseJson<MotionRun>(active.payload_json, "run"),
            );
          }
        }
        if (
          (msg.includes("idx_runs_idempotency") ||
            (msg.includes("UNIQUE constraint failed") && msg.includes("idempotency"))) &&
          opts?.idempotencyKey
        ) {
          const prior = db
            .prepare(
              `SELECT payload_json FROM runs WHERE workspace_id = ? AND idempotency_key = ?`,
            )
            .get(workspaceId, opts.idempotencyKey) as { payload_json: string } | undefined;
          if (prior) {
            throw new ConflictError(
              "Idempotent replay",
              parseJson<MotionRun>(prior.payload_json, "run"),
            );
          }
        }
        throw err;
      }
    } else {
      db.prepare(
        `UPDATE runs SET status = ?, payload_json = ?, updated_at = ?, loop_id = ? WHERE workspace_id = ? AND id = ?`,
      ).run(run.status, JSON.stringify(run), now, run.loopId, workspaceId, run.id);
    }
    touchMeta(workspaceId);
  });
  return getSnapshot(workspaceId);
}

export async function getRun(workspaceId: string, id: string): Promise<MotionRun | null> {
  ensureWorkspaceReady(workspaceId);
  const row = getSqlite()
    .prepare("SELECT payload_json FROM runs WHERE workspace_id = ? AND id = ?")
    .get(workspaceId, id) as { payload_json: string } | undefined;
  return row ? parseJson<MotionRun>(row.payload_json, "run") : null;
}

export async function getActiveRunForLoop(
  workspaceId: string,
  loopId: string,
): Promise<MotionRun | null> {
  ensureWorkspaceReady(workspaceId);
  const row = getSqlite()
    .prepare(
      `SELECT payload_json FROM runs WHERE workspace_id = ? AND loop_id = ? AND status IN ('queued','running') LIMIT 1`,
    )
    .get(workspaceId, loopId) as { payload_json: string } | undefined;
  return row ? parseJson<MotionRun>(row.payload_json, "run") : null;
}

export async function getRunByIdempotencyKey(
  workspaceId: string,
  key: string,
): Promise<MotionRun | null> {
  ensureWorkspaceReady(workspaceId);
  const row = getSqlite()
    .prepare(`SELECT payload_json FROM runs WHERE workspace_id = ? AND idempotency_key = ?`)
    .get(workspaceId, key) as { payload_json: string } | undefined;
  return row ? parseJson<MotionRun>(row.payload_json, "run") : null;
}

export async function listRuns(workspaceId: string): Promise<MotionRun[]> {
  const snap = await getSnapshot(workspaceId);
  return snap.runs;
}

export async function recordDebtFreed(workspaceId: string, dollars: number) {
  ensureWorkspaceReady(workspaceId);
  withTransaction((db) => {
    db.prepare(
      `UPDATE workspace_meta SET dollars_freed_lifetime = dollars_freed_lifetime + ?, updated_at = ? WHERE workspace_id = ?`,
    ).run(dollars, new Date().toISOString(), workspaceId);
  });
  return getSnapshot(workspaceId);
}

export async function saveWatchdogs(workspaceId: string, watchdogs: WatchdogRule[]) {
  ensureWorkspaceReady(workspaceId);
  withTransaction((db) => {
    for (const w of watchdogs) {
      db.prepare(
        `INSERT INTO watchdogs (workspace_id, id, name, description, enabled, last_fired_at, fire_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(workspace_id, id) DO UPDATE SET
           name=excluded.name, description=excluded.description, enabled=excluded.enabled,
           last_fired_at=excluded.last_fired_at, fire_count=excluded.fire_count`,
      ).run(
        workspaceId,
        w.id,
        w.name,
        w.description,
        w.enabled ? 1 : 0,
        w.lastFiredAt ?? null,
        w.fireCount,
      );
    }
    touchMeta(workspaceId);
  });
  return getSnapshot(workspaceId);
}

export async function patchWatchdog(
  workspaceId: string,
  id: string,
  patch: Partial<WatchdogRule>,
) {
  ensureWorkspaceReady(workspaceId);
  const snap = await getSnapshot(workspaceId);
  const rule = snap.watchdogs.find((w) => w.id === id);
  if (!rule) throw new Error("Watchdog not found");
  Object.assign(rule, patch);
  return saveWatchdogs(workspaceId, snap.watchdogs);
}

export async function listRiskEntities(workspaceId: string): Promise<RiskEntity[]> {
  const snap = await getSnapshot(workspaceId);
  return snap.riskEntities ?? [];
}

export async function enqueueJob(workspaceId: string, runId: string) {
  const db = getSqlite();
  const now = new Date().toISOString();
  const id = `job_${nanoid(12)}`;
  db.prepare(
    `INSERT INTO jobs (id, workspace_id, run_id, kind, status, attempts, created_at, updated_at)
     VALUES (?, ?, ?, 'execute_run', 'pending', 0, ?, ?)`,
  ).run(id, workspaceId, runId, now, now);
  return id;
}

export type JobRow = {
  id: string;
  workspace_id: string;
  run_id: string;
  kind: string;
  status: string;
  lease_owner: string | null;
  lease_expires_at: string | null;
  attempts: number;
  last_error: string | null;
};

export function recoverExpiredLeases() {
  const db = getSqlite();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE jobs SET status = 'pending', lease_owner = NULL, lease_expires_at = NULL, updated_at = ?
     WHERE status = 'leased' AND lease_expires_at IS NOT NULL AND lease_expires_at < ?`,
  ).run(now, now);
}

export function claimNextJob(owner: string, leaseMs = 60_000): JobRow | null {
  recoverExpiredLeases();
  return withTransaction((db) => {
    const row = db
      .prepare(
        `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1`,
      )
      .get() as JobRow | undefined;
    if (!row) return null;
    const expires = new Date(Date.now() + leaseMs).toISOString();
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE jobs SET status = 'leased', lease_owner = ?, lease_expires_at = ?, attempts = attempts + 1, updated_at = ?
       WHERE id = ? AND status = 'pending'`,
    ).run(owner, expires, now, row.id);
    return {
      ...row,
      status: "leased",
      lease_owner: owner,
      lease_expires_at: expires,
      attempts: row.attempts + 1,
    };
  });
}

export function completeJob(jobId: string, ok: boolean, error?: string) {
  const now = new Date().toISOString();
  getSqlite()
    .prepare(
      `UPDATE jobs SET status = ?, lease_owner = NULL, lease_expires_at = NULL, last_error = ?, updated_at = ? WHERE id = ?`,
    )
    .run(ok ? "done" : "failed", error ?? null, now, jobId);
}

export function updateRunStatus(workspaceId: string, runId: string, status: RunStatus) {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT payload_json FROM runs WHERE workspace_id = ? AND id = ?`)
    .get(workspaceId, runId) as { payload_json: string } | undefined;
  if (!row) return;
  const run = parseJson<MotionRun>(row.payload_json, "run");
  run.status = status;
  db.prepare(
    `UPDATE runs SET status = ?, payload_json = ?, updated_at = ? WHERE workspace_id = ? AND id = ?`,
  ).run(status, JSON.stringify(run), new Date().toISOString(), workspaceId, runId);
}

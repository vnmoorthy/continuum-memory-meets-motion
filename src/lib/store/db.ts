import { promises as fs } from "fs";
import path from "path";
import { computeDebtMetrics } from "../debt";
import { createSeedSnapshot } from "../seed";
import { defaultWatchdogs } from "../watchdogs";
import type {
  GraphSnapshot,
  MemoryEdge,
  MemoryNode,
  MotionRun,
  OpenLoop,
  WatchdogRule,
} from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "continuum.json");

function normalize(snapshot: GraphSnapshot): GraphSnapshot {
  if (!snapshot.watchdogs?.length) snapshot.watchdogs = defaultWatchdogs();
  if (typeof snapshot.dollarsFreedLifetime !== "number") snapshot.dollarsFreedLifetime = 0;
  if (typeof snapshot.debtBaseline !== "number" || snapshot.debtBaseline === 0) {
    snapshot.debtBaseline = computeDebtMetrics(snapshot).score;
  }
  for (const run of snapshot.runs ?? []) {
    if (!run.citations) run.citations = [];
    for (const a of run.artifacts ?? []) {
      if (!a.citations) a.citations = [];
    }
  }
  return snapshot;
}

async function ensureDb(): Promise<GraphSnapshot> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return normalize(JSON.parse(raw) as GraphSnapshot);
  } catch {
    const seed = createSeedSnapshot();
    seed.debtBaseline = computeDebtMetrics(seed).score;
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function writeDb(snapshot: GraphSnapshot) {
  snapshot.updatedAt = new Date().toISOString();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(snapshot, null, 2));
  return snapshot;
}

export async function getSnapshot() {
  return ensureDb();
}

export async function resetSnapshot() {
  const seed = createSeedSnapshot();
  seed.debtBaseline = computeDebtMetrics(seed).score;
  return writeDb(seed);
}

export async function upsertNode(node: MemoryNode) {
  const db = await ensureDb();
  const idx = db.nodes.findIndex((n) => n.id === node.id);
  if (idx >= 0) db.nodes[idx] = node;
  else db.nodes.push(node);

  if (node.kind === "loop") {
    const loop = node as OpenLoop;
    const lidx = db.loops.findIndex((l) => l.id === loop.id);
    if (lidx >= 0) db.loops[lidx] = loop;
    else db.loops.push(loop);
  }
  return writeDb(db);
}

export async function upsertEdge(edge: MemoryEdge) {
  const db = await ensureDb();
  const idx = db.edges.findIndex((e) => e.id === edge.id);
  if (idx >= 0) db.edges[idx] = edge;
  else db.edges.push(edge);
  return writeDb(db);
}

export async function deleteNode(id: string) {
  const db = await ensureDb();
  db.nodes = db.nodes.filter((n) => n.id !== id);
  db.loops = db.loops.filter((l) => l.id !== id);
  db.edges = db.edges.filter((e) => e.source !== id && e.target !== id);
  return writeDb(db);
}

export async function updateLoop(id: string, patch: Partial<OpenLoop>) {
  const db = await ensureDb();
  const loop = db.loops.find((l) => l.id === id);
  if (!loop) throw new Error("Loop not found");
  Object.assign(loop, patch, { updatedAt: new Date().toISOString() });
  const nidx = db.nodes.findIndex((n) => n.id === id);
  if (nidx >= 0) db.nodes[nidx] = { ...loop };
  return writeDb(db);
}

export async function saveRun(run: MotionRun) {
  const db = await ensureDb();
  const idx = db.runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) db.runs[idx] = run;
  else db.runs.unshift(run);
  return writeDb(db);
}

export async function getRun(id: string) {
  const db = await ensureDb();
  return db.runs.find((r) => r.id === id) ?? null;
}

export async function listRuns() {
  const db = await ensureDb();
  return db.runs;
}

export async function recordDebtFreed(dollars: number) {
  const db = await ensureDb();
  db.dollarsFreedLifetime = (db.dollarsFreedLifetime ?? 0) + dollars;
  return writeDb(db);
}

export async function saveWatchdogs(watchdogs: WatchdogRule[]) {
  const db = await ensureDb();
  db.watchdogs = watchdogs;
  return writeDb(db);
}

export async function patchWatchdog(id: string, patch: Partial<WatchdogRule>) {
  const db = await ensureDb();
  const rule = db.watchdogs.find((w) => w.id === id);
  if (!rule) throw new Error("Watchdog not found");
  Object.assign(rule, patch);
  return writeDb(db);
}

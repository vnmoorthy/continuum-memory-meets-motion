import path from "path";
import os from "os";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeSqlite, getSqlite, DatastoreCorruptError } from "../src/lib/store/sqlite";
import {
  getActiveRunForLoop,
  getRun,
  getSnapshot,
  resetSnapshot,
  upsertNode,
  ValidationStoreError,
} from "../src/lib/store/db";
import { createQueuedRun } from "../src/lib/motion/runtime";
import { computeDebtMetrics, uniqueRiskDollars } from "../src/lib/debt";
import { TagsSchema } from "../src/lib/schemas";
import { isDemoMode, modePayload } from "../src/lib/mode";
import { drainJobs } from "../src/lib/jobs/worker";

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "continuum-"));
  const dbPath = path.join(dir, "test.sqlite");
  process.env.CONTINUUM_DB_PATH = dbPath;
  process.env.CONTINUUM_MODE = "demo";
  process.env.CONTINUUM_FAST = "1";
  process.env.CONTINUUM_AUTO_WORKER = "0";
  closeSqlite();
  return { dir, dbPath };
}

async function waitForRun(ws: string, runId: string, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await drainJobs(8);
    const run = await getRun(ws, runId);
    if (run && (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled")) {
      return run;
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  return getRun(ws, runId);
}

beforeEach(() => {
  tempDb();
});

afterEach(() => {
  closeSqlite();
});

describe("serial happy path", () => {
  it("closes a loop, writes artifact, reduces debt", async () => {
    const ws = "ws_happy";
    await resetSnapshot(ws);
    const before = computeDebtMetrics(await getSnapshot(ws));
    const created = await createQueuedRun(ws, "loop-renewal-brief", "manual");
    expect(created.ok && created.created).toBe(true);
    if (!created.ok || !created.created) return;
    const run = await waitForRun(ws, created.run.id);
    expect(run?.status).toBe("succeeded");
    expect(run?.simulated).toBe(true);
    expect(run?.artifacts.length).toBeGreaterThan(0);
    expect(run?.artifacts[0]?.content).toMatch(/DEMO|Citations/i);
    const after = computeDebtMetrics(await getSnapshot(ws));
    expect(after.score).toBeLessThan(before.score);
    const loop = (await getSnapshot(ws)).loops.find((l) => l.id === "loop-renewal-brief");
    expect(loop?.status).toBe("closed");
  });
});

describe("same-loop concurrency", () => {
  it("allows at most one active run across 50 concurrent creates", async () => {
    const ws = "ws_conc";
    await resetSnapshot(ws);
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        createQueuedRun(ws, "loop-rfc-research", "manual", `idem-conc-${i % 7}`),
      ),
    );
    const created = results.filter((r) => r.ok && r.created);
    const conflicts = results.filter((r) => r.ok && !r.created);
    expect(created.length).toBe(1);
    expect(conflicts.length).toBe(49);
    const active = await getActiveRunForLoop(ws, "loop-rfc-research");
    expect(active).not.toBeNull();
    for (const r of results) {
      if (r.ok) {
        const got = await getRun(ws, r.run.id);
        expect(got).not.toBeNull();
      }
    }
  });

  it("replays Idempotency-Key without a second run", async () => {
    const ws = "ws_idem";
    await resetSnapshot(ws);
    const a = await createQueuedRun(ws, "loop-pilot-update", "manual", "same-key");
    const b = await createQueuedRun(ws, "loop-pilot-update", "manual", "same-key");
    expect(a.ok && a.created).toBe(true);
    expect(b.ok && !b.created && b.conflict === "idempotent").toBe(true);
    if (a.ok && b.ok) expect(a.run.id).toBe(b.run.id);
  });
});

describe("validation fuzzing", () => {
  it("rejects non-array tags with 422-class ValidationStoreError", async () => {
    const ws = "ws_tags";
    await resetSnapshot(ws);
    await expect(
      upsertNode(ws, {
        id: "bad-node",
        kind: "artifact",
        title: "Bad tags",
        summary: "x",
        // @ts-expect-error intentional invalid tags
        tags: "not-an-array",
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(ValidationStoreError);

    expect(TagsSchema.safeParse("nope").success).toBe(false);
    expect(TagsSchema.safeParse({ a: 1 }).success).toBe(false);
    expect(TagsSchema.safeParse(["ok", "tags"]).success).toBe(true);
  });
});

describe("accounting uniqueness", () => {
  it("counts Acme $220k once across related open loops", async () => {
    const ws = "ws_acct";
    await resetSnapshot(ws);
    const snap = await getSnapshot(ws);
    const dollars = uniqueRiskDollars(snap);
    expect(dollars).toBe(268_000);
    const metrics = computeDebtMetrics(snap);
    expect(metrics.dollarsAtRisk).toBe(268_000);
  });
});

describe("demo mode labeling", () => {
  it("exposes demo mode metadata and labels simulated events", async () => {
    expect(isDemoMode()).toBe(true);
    expect(modePayload().demo).toBe(true);
    expect(modePayload().label).toBe("DEMO");
    const ws = "ws_demo";
    await resetSnapshot(ws);
    const created = await createQueuedRun(ws, "loop-rfc-research", "manual");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const run = await waitForRun(ws, created.run.id);
    expect(run?.mode).toBe("demo");
    expect(run?.simulated).toBe(true);
    expect(run?.events.some((e) => /DEMO/i.test(e.message))).toBe(true);
    expect(run?.artifacts[0]?.content).toMatch(/DEMO|Simulated/i);
  });
});

describe("corruption no-reseed", () => {
  it("refuses to silently reseed when integrity fails", async () => {
    const ws = "ws_corrupt";
    await resetSnapshot(ws);
    const dbPath = process.env.CONTINUUM_DB_PATH!;
    closeSqlite();
    fs.writeFileSync(dbPath, "NOT A SQLITE DATABASE {{{");
    expect(() => getSqlite()).toThrow(DatastoreCorruptError);
    const raw = fs.readFileSync(dbPath, "utf8");
    expect(raw.startsWith("NOT A SQLITE")).toBe(true);
  });
});

describe("durable jobs", () => {
  it("enqueues a job row and drain executes the run", async () => {
    const ws = "ws_job";
    await resetSnapshot(ws);
    const created = await createQueuedRun(ws, "loop-onboarding-playbook", "manual");
    expect(created.ok && created.created).toBe(true);
    if (!created.ok) return;
    const run = await waitForRun(ws, created.run.id);
    expect(run?.status).toBe("succeeded");
  });
});

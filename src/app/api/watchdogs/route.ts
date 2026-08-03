import { NextResponse } from "next/server";
import { startAndExecute } from "@/lib/motion/runtime";
import { getSnapshot, patchWatchdog, saveWatchdogs } from "@/lib/store/db";
import { scanWatchdogs } from "@/lib/watchdogs";
import type { WatchdogRule } from "@/lib/types";

export async function GET() {
  const snapshot = await getSnapshot();
  const hits = scanWatchdogs(snapshot);
  return NextResponse.json({
    watchdogs: snapshot.watchdogs,
    hits,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (body?.watchdogs && Array.isArray(body.watchdogs)) {
    const snapshot = await saveWatchdogs(body.watchdogs as WatchdogRule[]);
    return NextResponse.json({ watchdogs: snapshot.watchdogs });
  }
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const snapshot = await patchWatchdog(body.id, body.patch ?? { enabled: body.enabled });
  return NextResponse.json({ watchdogs: snapshot.watchdogs });
}

/** Scan now — optionally auto-queue matching loops (LaserData-style triggers). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const autoQueue = Boolean(body?.autoQueue ?? true);
  const limit = Math.min(Number(body?.limit ?? 2), 3);

  const snapshot = await getSnapshot();
  const hits = scanWatchdogs(snapshot);

  // bump fire metadata
  for (const hit of hits) {
    const rule = snapshot.watchdogs.find((w) => w.id === hit.ruleId);
    if (rule) {
      rule.fireCount += 1;
      rule.lastFiredAt = new Date().toISOString();
    }
  }
  await saveWatchdogs(snapshot.watchdogs);

  const runs = [];
  if (autoQueue) {
    for (const hit of hits.slice(0, limit)) {
      try {
        const run = await startAndExecute(hit.loopId, "watchdog");
        runs.push({ runId: run.id, loopId: hit.loopId, ruleId: hit.ruleId });
      } catch (err) {
        runs.push({
          loopId: hit.loopId,
          ruleId: hit.ruleId,
          error: err instanceof Error ? err.message : "failed",
        });
      }
    }
  }

  return NextResponse.json({
    scannedAt: new Date().toISOString(),
    hits,
    queued: runs,
  });
}

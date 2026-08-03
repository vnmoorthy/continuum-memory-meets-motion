import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { startAndExecute } from "@/lib/motion/runtime";
import {
  WatchdogPatchBodySchema,
  WatchdogScanBodySchema,
  zodErrorResponse,
} from "@/lib/schemas";
import { getSnapshot, patchWatchdog, saveWatchdogs } from "@/lib/store/db";
import { scanWatchdogs } from "@/lib/watchdogs";
import type { WatchdogRule } from "@/lib/types";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await withWorkspace();
    const snapshot = await getSnapshot(session.workspaceId);
    const hits = scanWatchdogs(snapshot);
    return jsonOk({
      watchdogs: snapshot.watchdogs,
      hits,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => null);
    const parsed = WatchdogPatchBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }
    const body = parsed.data;
    if (body.watchdogs && Array.isArray(body.watchdogs)) {
      const snapshot = await saveWatchdogs(session.workspaceId, body.watchdogs as WatchdogRule[]);
      return jsonOk({ watchdogs: snapshot.watchdogs });
    }
    if (!body.id) {
      return NextResponse.json({ error: "id required", _meta: modePayload() }, { status: 400 });
    }
    const snapshot = await patchWatchdog(
      session.workspaceId,
      body.id,
      body.patch ?? { enabled: body.enabled },
    );
    return jsonOk({ watchdogs: snapshot.watchdogs });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => ({}));
    const parsed = WatchdogScanBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }
    const { autoQueue, limit } = parsed.data;

    const snapshot = await getSnapshot(session.workspaceId);
    const hits = scanWatchdogs(snapshot);

    for (const hit of hits) {
      const rule = snapshot.watchdogs.find((w) => w.id === hit.ruleId);
      if (rule) {
        rule.fireCount += 1;
        rule.lastFiredAt = new Date().toISOString();
      }
    }
    await saveWatchdogs(session.workspaceId, snapshot.watchdogs);

    const runs = [];
    if (autoQueue) {
      for (const hit of hits.slice(0, limit)) {
        const result = await startAndExecute(session.workspaceId, hit.loopId, "watchdog");
        if (!result.ok) {
          runs.push({
            loopId: hit.loopId,
            ruleId: hit.ruleId,
            error: result.error,
          });
        } else {
          runs.push({
            runId: result.run.id,
            loopId: hit.loopId,
            ruleId: hit.ruleId,
            existing: !result.created,
          });
        }
      }
    }

    return jsonOk({
      scannedAt: new Date().toISOString(),
      hits,
      queued: runs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

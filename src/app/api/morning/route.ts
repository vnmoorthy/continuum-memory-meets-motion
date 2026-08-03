import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { rankLoopsForMorning } from "@/lib/debt";
import { startAndExecute } from "@/lib/motion/runtime";
import { MorningBodySchema, zodErrorResponse } from "@/lib/schemas";
import { getSnapshot } from "@/lib/store/db";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => ({}));
    const parsed = MorningBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }
    const snapshot = await getSnapshot(session.workspaceId);
    const targets = rankLoopsForMorning(snapshot, parsed.data.limit);

    if (targets.length === 0) {
      return jsonOk({ message: "No open loops to close", runs: [] });
    }

    const runs = [];
    for (const loop of targets) {
      const result = await startAndExecute(session.workspaceId, loop.id, "morning");
      if (!result.ok) {
        runs.push({ loopId: loop.id, title: loop.title, error: result.error });
      } else if (!result.created) {
        runs.push({
          runId: result.run.id,
          loopId: loop.id,
          title: loop.title,
          existing: true,
          conflict: result.conflict,
        });
      } else {
        runs.push({ runId: result.run.id, loopId: loop.id, title: loop.title });
      }
    }

    return jsonOk({
      message: `Close My Morning queued ${runs.length} Motion run(s)`,
      runs,
      _mode: modePayload(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

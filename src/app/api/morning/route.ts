import { NextResponse } from "next/server";
import { rankLoopsForMorning } from "@/lib/debt";
import { startAndExecute } from "@/lib/motion/runtime";
import { getSnapshot } from "@/lib/store/db";

/** Close My Morning — rank open loops by Open Loop Debt and run top N. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit ?? 2), 1), 3);
  const snapshot = await getSnapshot();
  const targets = rankLoopsForMorning(snapshot, limit);

  if (targets.length === 0) {
    return NextResponse.json({ message: "No open loops to close", runs: [] });
  }

  const runs = [];
  for (const loop of targets) {
    try {
      const run = await startAndExecute(loop.id, "morning");
      runs.push({ runId: run.id, loopId: loop.id, title: loop.title });
    } catch (err) {
      runs.push({
        loopId: loop.id,
        title: loop.title,
        error: err instanceof Error ? err.message : "failed",
      });
    }
  }

  return NextResponse.json({
    message: `Close My Morning queued ${runs.length} Motion run(s)`,
    runs,
  });
}

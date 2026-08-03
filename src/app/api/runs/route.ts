import { NextResponse } from "next/server";
import { startAndExecute } from "@/lib/motion/runtime";
import { getRun, listRuns } from "@/lib/store/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const run = await getRun(id);
    if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(run);
  }
  const runs = await listRuns();
  return NextResponse.json({ runs });
}

export async function POST(req: Request) {
  const body = await req.json();
  const loopId = body.loopId as string | undefined;
  if (!loopId) return NextResponse.json({ error: "loopId required" }, { status: 400 });

  try {
    const run = await startAndExecute(loopId, body.trigger ?? "manual");
    return NextResponse.json(run, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 400 },
    );
  }
}

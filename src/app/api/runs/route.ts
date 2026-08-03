import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { startAndExecute } from "@/lib/motion/runtime";
import { CreateRunBodySchema, zodErrorResponse } from "@/lib/schemas";
import { getRun, listRuns } from "@/lib/store/db";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await withWorkspace();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const run = await getRun(session.workspaceId, id);
      if (!run) return NextResponse.json({ error: "not found", _meta: modePayload() }, { status: 404 });
      return jsonOk(run);
    }
    const runs = await listRuns(session.workspaceId);
    return jsonOk({ runs });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => null);
    const parsed = CreateRunBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }

    const idempotencyKey = req.headers.get("idempotency-key")?.trim() || null;
    const result = await startAndExecute(
      session.workspaceId,
      parsed.data.loopId,
      parsed.data.trigger,
      idempotencyKey,
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, _meta: modePayload() },
        { status: result.status },
      );
    }

    if (!result.created) {
      return NextResponse.json(
        {
          ...result.run,
          conflict: result.conflict,
          existing: true,
          _meta: modePayload(),
        },
        { status: 409 },
      );
    }

    // Never 201 a run that cannot be read
    const readable = await getRun(session.workspaceId, result.run.id);
    if (!readable) {
      return NextResponse.json(
        { error: "run_not_readable", _meta: modePayload() },
        { status: 500 },
      );
    }

    return NextResponse.json({ ...readable, _meta: modePayload() }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

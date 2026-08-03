import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { nanoid } from "nanoid";
import { IngestBodySchema, zodErrorResponse } from "@/lib/schemas";
import { upsertEdge, upsertNode } from "@/lib/store/db";
import type { OpenLoop } from "@/lib/types";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => null);
    const parsed = IngestBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }
    const { text, source } = parsed.data;

    const eventId = `event-${nanoid(8)}`;
    const loopId = `loop-${nanoid(8)}`;
    const now = new Date().toISOString();

    const titleGuess =
      text.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length > 12)?.slice(0, 72) ??
      "Follow up from ingested residue";

    await upsertNode(session.workspaceId, {
      id: eventId,
      kind: "event",
      title: "Ingested residue",
      summary: text.slice(0, 280),
      tags: ["ingest", "user"],
      metadata: { source: source ?? "manual" },
      createdAt: now,
      updatedAt: now,
    });

    const loop: OpenLoop = {
      id: loopId,
      kind: "loop",
      title: titleGuess,
      summary: `Auto-extracted open loop from residue: ${text.slice(0, 200)}`,
      tags: ["ingest", "open"],
      status: "open",
      priority: 3,
      contextNodeIds: [eventId],
      suggestedActions: [
        "Retrieve related memory",
        "Draft a concrete artifact",
        "Write completion back to graph",
      ],
      metadata: { sourceEvent: eventId },
      createdAt: now,
      updatedAt: now,
    };

    await upsertNode(session.workspaceId, loop);
    await upsertEdge(session.workspaceId, {
      id: `edge-${nanoid(8)}`,
      source: eventId,
      target: loopId,
      kind: "mentions",
      weight: 1,
      createdAt: now,
    });

    return jsonOk({ eventId, loop, _mode: modePayload() }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

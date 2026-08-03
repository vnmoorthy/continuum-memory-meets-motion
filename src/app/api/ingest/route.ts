import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { upsertEdge, upsertNode } from "@/lib/store/db";
import type { OpenLoop } from "@/lib/types";

/**
 * Ingest freeform residue (meeting notes, standup, voice dump)
 * and materialize open loops into the memory graph.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const text = (body.text as string | undefined)?.trim();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const eventId = `event-${nanoid(8)}`;
  const loopId = `loop-${nanoid(8)}`;
  const now = new Date().toISOString();

  const titleGuess =
    text.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length > 12)?.slice(0, 72) ??
    "Follow up from ingested residue";

  await upsertNode({
    id: eventId,
    kind: "event",
    title: "Ingested residue",
    summary: text.slice(0, 280),
    tags: ["ingest", "user"],
    metadata: { source: body.source ?? "manual" },
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

  await upsertNode(loop);
  await upsertEdge({
    id: `edge-${nanoid(8)}`,
    source: eventId,
    target: loopId,
    kind: "mentions",
    weight: 1,
    createdAt: now,
  });

  return NextResponse.json({ eventId, loop });
}

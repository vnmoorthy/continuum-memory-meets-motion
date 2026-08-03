import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { CreateMemoryBodySchema, TagsSchema, zodErrorResponse } from "@/lib/schemas";
import { getSnapshot, resetSnapshot, upsertNode, ValidationStoreError } from "@/lib/store/db";
import { nanoid } from "nanoid";
import type { MemoryNode, OpenLoop } from "@/lib/types";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await withWorkspace();
    const snapshot = await getSnapshot(session.workspaceId);
    return jsonOk(snapshot);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => null);
    const parsed = CreateMemoryBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }
    const body = parsed.data;

    if (body.action === "reset") {
      const snapshot = await resetSnapshot(session.workspaceId);
      return jsonOk(snapshot);
    }

    if (body.tags !== undefined) {
      const tags = TagsSchema.safeParse(body.tags);
      if (!tags.success) {
        return NextResponse.json(zodErrorResponse(tags.error), { status: 422 });
      }
    }

    const kind = body.kind ?? "artifact";
    const now = new Date().toISOString();

    if (kind === "loop") {
      const loop: OpenLoop = {
        id: body.id ?? `loop-${nanoid(8)}`,
        kind: "loop",
        title: body.title ?? "Untitled loop",
        summary: body.summary ?? "",
        tags: body.tags ?? [],
        status: body.status ?? "open",
        priority: body.priority ?? 3,
        contextNodeIds: body.contextNodeIds ?? [],
        suggestedActions: body.suggestedActions ?? ["Retrieve context", "Act", "Write back"],
        riskEntityId: body.riskEntityId,
        metadata: body.metadata ?? {},
        createdAt: now,
        updatedAt: now,
      };
      const snapshot = await upsertNode(session.workspaceId, loop);
      return jsonOk({ node: loop, snapshot }, { status: 201 });
    }

    const node: MemoryNode = {
      id: body.id ?? `${kind}-${nanoid(8)}`,
      kind,
      title: body.title ?? "Untitled memory",
      summary: body.summary ?? "",
      tags: body.tags ?? [],
      metadata: body.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    const snapshot = await upsertNode(session.workspaceId, node);
    return jsonOk({ node, snapshot }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationStoreError) {
      return NextResponse.json(
        { error: err.message, _meta: modePayload() },
        { status: err.status },
      );
    }
    return handleApiError(err);
  }
}

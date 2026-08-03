import { NextResponse } from "next/server";
import { getSnapshot, resetSnapshot, upsertNode } from "@/lib/store/db";
import { nanoid } from "nanoid";
import type { MemoryNode, NodeKind } from "@/lib/types";

export async function GET() {
  const snapshot = await getSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body?.action === "reset") {
    const snapshot = await resetSnapshot();
    return NextResponse.json(snapshot);
  }

  const kind = (body.kind ?? "artifact") as NodeKind;
  const node: MemoryNode = {
    id: body.id ?? `${kind}-${nanoid(8)}`,
    kind,
    title: body.title ?? "Untitled memory",
    summary: body.summary ?? "",
    tags: body.tags ?? [],
    metadata: body.metadata ?? {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(kind === "loop"
      ? {
          status: body.status ?? "open",
          priority: body.priority ?? 3,
          contextNodeIds: body.contextNodeIds ?? [],
          suggestedActions: body.suggestedActions ?? ["Retrieve context", "Act", "Write back"],
        }
      : {}),
  };

  const snapshot = await upsertNode(node);
  return NextResponse.json({ node, snapshot });
}

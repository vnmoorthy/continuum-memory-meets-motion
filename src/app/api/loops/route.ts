import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { getSnapshot, updateLoop } from "@/lib/store/db";
import { z } from "zod";
import { LoopStatusSchema, zodErrorResponse } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  id: z.string().min(1),
  patch: z
    .object({
      status: LoopStatusSchema.optional(),
      priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
    })
    .default({}),
});

export async function GET() {
  try {
    const session = await withWorkspace();
    const snapshot = await getSnapshot(session.workspaceId);
    return jsonOk({
      loops: snapshot.loops,
      open: snapshot.loops.filter(
        (l) => l.status === "open" || l.status === "running" || l.status === "blocked",
      ),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await withWorkspace();
    const raw = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 422 });
    }
    const snapshot = await updateLoop(session.workspaceId, parsed.data.id, parsed.data.patch);
    return jsonOk(snapshot);
  } catch (err) {
    return handleApiError(err);
  }
}

import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { searchMemory } from "@/lib/memory/graph";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await withWorkspace();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const hits = await searchMemory(session.workspaceId, q);
    return jsonOk({ query: q, hits });
  } catch (err) {
    return handleApiError(err);
  }
}

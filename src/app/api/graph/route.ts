import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { getMemorySubgraph } from "@/lib/memory/graph";
import { getSnapshot } from "@/lib/store/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await withWorkspace();
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get("seed");
    const snapshot = await getSnapshot(session.workspaceId);

    if (seed) {
      const ids = seed.split(",").filter(Boolean);
      const subgraph = await getMemorySubgraph(session.workspaceId, ids, 1);
      return jsonOk(subgraph);
    }

    return jsonOk({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

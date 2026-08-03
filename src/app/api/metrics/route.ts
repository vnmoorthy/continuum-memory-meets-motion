import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { computeDebtMetrics } from "@/lib/debt";
import { getSnapshot } from "@/lib/store/db";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await withWorkspace();
    const snapshot = await getSnapshot(session.workspaceId);
    const metrics = computeDebtMetrics(snapshot);
    return jsonOk({ ...metrics, mode: modePayload() });
  } catch (err) {
    return handleApiError(err);
  }
}

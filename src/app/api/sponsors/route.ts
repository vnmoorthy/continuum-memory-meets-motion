import { NextResponse } from "next/server";
import { withWorkspace, jsonOk, handleApiError } from "@/lib/api/http";
import { getAllSponsorStatuses, runSnykScan, sponsorSummary } from "@/lib/sponsors";
import { modePayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await withWorkspace();
    const sponsors = await getAllSponsorStatuses();
    return jsonOk({
      _meta: modePayload(session.workspaceId),
      summary: sponsorSummary(sponsors),
      sponsors,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await withWorkspace();
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (body.action === "snyk_scan") {
      const result = await runSnykScan();
      const sponsors = await getAllSponsorStatuses();
      return jsonOk({ snyk: result, sponsors, summary: sponsorSummary(sponsors) });
    }
    return NextResponse.json({ error: "Unknown action. Use { action: \"snyk_scan\" }." }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}

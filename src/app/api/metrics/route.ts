import { NextResponse } from "next/server";
import { computeDebtMetrics } from "@/lib/debt";
import { getSnapshot } from "@/lib/store/db";

export async function GET() {
  const snapshot = await getSnapshot();
  const metrics = computeDebtMetrics(snapshot);
  return NextResponse.json(metrics);
}

import { NextResponse } from "next/server";
import { getMemorySubgraph } from "@/lib/memory/graph";
import { getSnapshot } from "@/lib/store/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seed = searchParams.get("seed");
  const snapshot = await getSnapshot();

  if (seed) {
    const ids = seed.split(",").filter(Boolean);
    const subgraph = await getMemorySubgraph(ids, 1);
    return NextResponse.json(subgraph);
  }

  return NextResponse.json({
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  });
}

import { NextResponse } from "next/server";
import { searchMemory } from "@/lib/memory/graph";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const hits = await searchMemory(q);
  return NextResponse.json({ query: q, hits });
}

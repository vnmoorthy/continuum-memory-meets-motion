import { NextResponse } from "next/server";
import { getSnapshot, updateLoop } from "@/lib/store/db";

export async function GET() {
  const snapshot = await getSnapshot();
  return NextResponse.json({
    loops: snapshot.loops,
    open: snapshot.loops.filter((l) => l.status === "open" || l.status === "running" || l.status === "blocked"),
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const snapshot = await updateLoop(body.id, body.patch ?? {});
  return NextResponse.json(snapshot);
}

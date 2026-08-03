import { NextResponse } from "next/server";
import { requireSession, type DemoSession } from "@/lib/auth/session";
import { modePayload } from "@/lib/mode";
import {
  DatastoreCorruptError,
  ValidationStoreError,
} from "@/lib/store/db";
import { ensureWorkerStarted } from "@/lib/jobs/worker";

export async function withWorkspace(): Promise<DemoSession> {
  ensureWorkerStarted();
  return requireSession();
}

export function jsonOk(data: unknown, init?: ResponseInit, workspaceId?: string) {
  const mode = modePayload(workspaceId);
  const body =
    data && typeof data === "object" && !Array.isArray(data)
      ? { ...(data as object), _meta: mode }
      : { data, _meta: mode };
  return NextResponse.json(body, init);
}

export function handleApiError(err: unknown) {
  if (err instanceof ValidationStoreError) {
    return NextResponse.json({ error: err.message, _meta: modePayload() }, { status: err.status });
  }
  if (err instanceof DatastoreCorruptError) {
    return NextResponse.json(
      {
        error: "datastore_corrupt",
        message: err.message,
        _meta: modePayload(),
      },
      { status: 500 },
    );
  }
  console.error("[continuum] api error", err);
  return NextResponse.json(
    {
      error: err instanceof Error ? err.message : "internal_error",
      _meta: modePayload(),
    },
    { status: 500 },
  );
}

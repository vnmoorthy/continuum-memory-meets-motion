import { NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { getRun } from "@/lib/store/db";
import { modePayload } from "@/lib/mode";
import { ensureWorkerStarted } from "@/lib/jobs/worker";

export const dynamic = "force-dynamic";

/**
 * Polling-friendly SSE for a motion run.
 * Events are durable in SQLite; this stream is best-effort delivery of stored events.
 * Clients should also poll GET /api/runs?id= as a fallback (hooks already do).
 */
export async function GET(req: NextRequest) {
  ensureWorkerStarted();
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) {
    return new Response("runId required", { status: 400 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSession(token);
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthorized", _meta: modePayload() }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let closed = false;
  const mode = modePayload();

  const stream = new ReadableStream({
    async start(controller) {
      let lastEventCount = 0;
      const push = (data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      push({
        type: "hello",
        runId,
        ts: new Date().toISOString(),
        delivery: "best-effort-sse",
        fallback: `/api/runs?id=${runId}`,
        _meta: mode,
      });

      while (!closed) {
        const run = await getRun(session.workspaceId, runId);
        if (!run) {
          push({ type: "error", message: "run not found", _meta: mode });
          break;
        }

        if (run.events.length > lastEventCount) {
          const fresh = run.events.slice(lastEventCount);
          lastEventCount = run.events.length;
          for (const ev of fresh) {
            push({ type: "event", event: ev, status: run.status, steps: run.steps, _meta: mode });
          }
        } else {
          push({
            type: "heartbeat",
            status: run.status,
            stepStatuses: run.steps.map((s) => s.status),
            _meta: mode,
          });
        }

        if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
          push({ type: "done", run, _meta: mode });
          break;
        }

        await new Promise((r) => setTimeout(r, 400));
      }

      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

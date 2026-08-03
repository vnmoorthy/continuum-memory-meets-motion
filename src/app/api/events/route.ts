import { NextRequest } from "next/server";
import { getRun } from "@/lib/store/db";

/** LaserData-style event stream for a motion run */
export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) {
    return new Response("runId required", { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      let lastEventCount = 0;
      const push = (data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      push({ type: "hello", runId, ts: new Date().toISOString() });

      while (!closed) {
        const run = await getRun(runId);
        if (!run) {
          push({ type: "error", message: "run not found" });
          break;
        }

        if (run.events.length > lastEventCount) {
          const fresh = run.events.slice(lastEventCount);
          lastEventCount = run.events.length;
          for (const ev of fresh) {
            push({ type: "event", event: ev, status: run.status, steps: run.steps });
          }
        } else {
          push({ type: "heartbeat", status: run.status, stepStatuses: run.steps.map((s) => s.status) });
        }

        if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
          push({ type: "done", run });
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

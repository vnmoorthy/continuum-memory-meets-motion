import { nanoid } from "nanoid";
import {
  claimNextJob,
  completeJob,
  recoverExpiredLeases,
} from "../store/db";
import { executeRun } from "../motion/runtime";

const OWNER = `worker_${process.pid}_${nanoid(6)}`;

const g = globalThis as unknown as {
  __continuumWorkerStarted?: boolean;
  __continuumWorkerTimer?: ReturnType<typeof setInterval>;
};

async function processOne(): Promise<boolean> {
  recoverExpiredLeases();
  const job = claimNextJob(OWNER, 90_000);
  if (!job) return false;
  try {
    await executeRun(job.workspace_id, job.run_id);
    completeJob(job.id, true);
  } catch (err) {
    completeJob(job.id, false, err instanceof Error ? err.message : String(err));
  }
  return true;
}

/** Drain pending jobs. Durable source of truth is the jobs table — not after(). */
export async function drainJobs(max = 8) {
  for (let i = 0; i < max; i++) {
    const did = await processOne();
    if (!did) break;
  }
}

export function ensureWorkerStarted() {
  if (process.env.CONTINUUM_AUTO_WORKER === "0") return;
  if (g.__continuumWorkerStarted) return;
  g.__continuumWorkerStarted = true;
  void drainJobs(16).catch((err) => console.error("[continuum] worker startup drain", err));
  g.__continuumWorkerTimer = setInterval(() => {
    void drainJobs(4).catch((err) => console.error("[continuum] worker tick", err));
  }, 1500);
  if (typeof g.__continuumWorkerTimer === "object" && "unref" in g.__continuumWorkerTimer) {
    g.__continuumWorkerTimer.unref?.();
  }
}

/**
 * Kick the in-process worker after the HTTP response.
 * Durability comes from the job row + lease recovery; after() is a latency hint only.
 */
export function scheduleJobKick() {
  if (process.env.CONTINUUM_AUTO_WORKER === "0") return;
  ensureWorkerStarted();
  void import("next/server")
    .then(({ after }) => {
      try {
        after(() => {
          void drainJobs(4);
        });
      } catch {
        void drainJobs(4);
      }
    })
    .catch(() => {
      void drainJobs(4);
    });
}

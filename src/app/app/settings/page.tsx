"use client";

import { Suspense, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { resetMemory } from "@/lib/hooks";

function SettingsInner() {
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  async function onReset() {
    setResetting(true);
    setDone(false);
    try {
      await resetMemory();
      setDone(true);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Settings</p>
        <h1 className="display mt-1 text-3xl md:text-4xl">Runtime & mode</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Continuum defaults to <strong className="text-ink">DEMO mode</strong> with a
          workspace-scoped SQLite store and simulated Motion steps. Connected sponsor
          integrations are not active unless you set credentials and{" "}
          <code className="mono text-accent">CONTINUUM_MODE=connected</code>.
        </p>
      </div>

      <div className="panel max-w-2xl space-y-3 border border-amber-800/40 p-5">
        <h2 className="display text-xl">Mode: DEMO</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Research / Linkup steps use labeled synthetic findings — not live web.</li>
          <li>Notify step is in-app only — no email/Slack delivery receipts.</li>
          <li>API responses include <code className="mono text-accent">_meta.mode=demo</code>.</li>
          <li>
            Persistence: SQLite WAL under <code className="mono text-accent">data/continuum.sqlite</code>{" "}
            with per-session workspace isolation.
          </li>
        </ul>
        <p className="text-sm text-muted">
          Connector preference forms were removed because saving a URI/API key locally did not
          enable a real connection. Wire credentials via environment variables when you implement
          connected mode.
        </p>
      </div>

      <div className="panel max-w-2xl space-y-3 p-5">
        <h2 className="display text-xl">Demo controls</h2>
        <p className="text-sm text-muted">
          Reset restores the Northstar / Acme seed graph for <em>this workspace</em> and clears
          prior motion runs and jobs.
        </p>
        <button className="btn btn-ghost" onClick={() => void onReset()} disabled={resetting}>
          {resetting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Reset memory to seed
        </button>
        {done && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> Seed restored for this workspace.
          </p>
        )}
      </div>

      <div className="panel max-w-2xl space-y-2 p-5 text-sm text-muted">
        <h2 className="display text-xl text-ink">Architecture snapshot</h2>
        <p>
          <strong className="text-ink">Memory:</strong> SQLite-backed property graph with
          transactional writes and workspace isolation (FalkorDB-ready shape).
        </p>
        <p>
          <strong className="text-ink">Motion:</strong>{" "}
          <code className="mono text-accent">pipelines/close-open-loop.json</code> executed via
          durable job rows + lease recovery (not fire-and-forget alone).
        </p>
        <p>
          <strong className="text-ink">Stream:</strong> SSE at{" "}
          <code className="mono text-accent">/api/events</code> is best-effort; UI also polls{" "}
          <code className="mono text-accent">/api/runs</code>.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[40vh] items-center justify-center text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}

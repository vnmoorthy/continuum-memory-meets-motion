"use client";

import { Suspense, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { resetMemory } from "@/lib/hooks";

function SettingsInner() {
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [rocketUri, setRocketUri] = useState("https://api.rocketride.ai");
  const [falkorHost, setFalkorHost] = useState("localhost:6379");
  const [linkupKey, setLinkupKey] = useState("");
  const [saved, setSaved] = useState(false);

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

  function onSaveIntegrations(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(
      "continuum.integrations",
      JSON.stringify({ rocketUri, falkorHost, linkupKey: linkupKey ? "***set***" : "" }),
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Settings</p>
        <h1 className="display mt-1 text-3xl md:text-4xl">Runtime & integrations</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Continuum ships with a local memory store and Motion runtime so the demo always
          works. Point these at sponsor stacks when you have credentials.
        </p>
      </div>

      <form onSubmit={onSaveIntegrations} className="panel max-w-2xl space-y-4 p-5">
        <h2 className="display text-xl">Sponsor connectors</h2>
        <label className="block space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
            RocketRide URI
          </span>
          <input className="field" value={rocketUri} onChange={(e) => setRocketUri(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
            FalkorDB host
          </span>
          <input
            className="field"
            value={falkorHost}
            onChange={(e) => setFalkorHost(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Linkup API key
          </span>
          <input
            className="field"
            type="password"
            placeholder="Optional — demo uses synthetic research"
            value={linkupKey}
            onChange={(e) => setLinkupKey(e.target.value)}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Saved locally
            </>
          ) : (
            "Save preferences"
          )}
        </button>
      </form>

      <div className="panel max-w-2xl space-y-3 p-5">
        <h2 className="display text-xl">Demo controls</h2>
        <p className="text-sm text-muted">
          Reset restores the Northstar / Acme seed graph and clears prior motion runs.
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
            <CheckCircle2 className="h-4 w-4" /> Seed restored.
          </p>
        )}
      </div>

      <div className="panel max-w-2xl space-y-2 p-5 text-sm text-muted">
        <h2 className="display text-xl text-ink">Architecture snapshot</h2>
        <p>
          <strong className="text-ink">Memory:</strong> property graph (nodes/edges/loops) with
          Cypher-flavored create helpers for FalkorDB parity.
        </p>
        <p>
          <strong className="text-ink">Motion:</strong>{" "}
          <code className="mono text-accent">pipelines/close-open-loop.json</code> executed by
          the Continuum runtime (RocketRide-compatible shape).
        </p>
        <p>
          <strong className="text-ink">Stream:</strong> SSE endpoint at{" "}
          <code className="mono text-accent">/api/events</code> for live run telemetry.
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

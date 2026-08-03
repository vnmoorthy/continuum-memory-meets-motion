"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Shield, PlugZap } from "lucide-react";
import { resetMemory } from "@/lib/hooks";
import type { SponsorStatus } from "@/lib/sponsors/types";

function stateColor(state: SponsorStatus["state"]) {
  switch (state) {
    case "live":
      return "text-success";
    case "configured_unreachable":
      return "text-warn";
    case "demo_fallback":
      return "text-accent";
    default:
      return "text-muted";
  }
}

function SettingsInner() {
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [sponsors, setSponsors] = useState<SponsorStatus[]>([]);
  const [summary, setSummary] = useState<{
    liveCount: number;
    configuredCount: number;
    sdkLoadedCount: number;
    allSdksPresent: boolean;
  } | null>(null);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [snykBusy, setSnykBusy] = useState(false);
  const [snykMsg, setSnykMsg] = useState<string | null>(null);

  const loadSponsors = useCallback(async () => {
    setLoadingSponsors(true);
    try {
      const res = await fetch("/api/sponsors", { cache: "no-store" });
      const json = (await res.json()) as {
        sponsors?: SponsorStatus[];
        summary?: typeof summary;
      };
      setSponsors(json.sponsors ?? []);
      setSummary(json.summary ?? null);
    } catch {
      setSponsors([]);
    } finally {
      setLoadingSponsors(false);
    }
  }, []);

  useEffect(() => {
    void loadSponsors();
  }, [loadSponsors]);

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

  async function onSnykScan() {
    setSnykBusy(true);
    setSnykMsg(null);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "snyk_scan" }),
      });
      const json = (await res.json()) as {
        snyk?: { ok: boolean; uniqueCount: number; error?: string };
        sponsors?: SponsorStatus[];
        summary?: typeof summary;
      };
      if (json.sponsors) setSponsors(json.sponsors);
      if (json.summary) setSummary(json.summary);
      setSnykMsg(
        json.snyk?.ok
          ? `Snyk scan complete — unique issues reported: ${json.snyk.uniqueCount}`
          : `Snyk scan failed: ${json.snyk?.error ?? res.statusText}`,
      );
    } finally {
      setSnykBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Settings</p>
        <h1 className="display mt-1 text-3xl md:text-4xl">Sponsors & runtime</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Continuum imports every Memory Meets Motion sponsor SDK. Without credentials, each
          adapter stays on an honest DEMO/fallback path. With credentials, the same code path goes
          live.
        </p>
      </div>

      <div className="panel max-w-3xl space-y-3 border border-accent/30 p-5">
        <div className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-accent" />
          <h2 className="display text-xl">Sponsor SDKs</h2>
        </div>
        {summary && (
          <p className="text-sm text-muted">
            SDKs loaded: <strong className="text-ink">{summary.sdkLoadedCount}</strong> · configured:{" "}
            <strong className="text-ink">{summary.configuredCount}</strong> · live:{" "}
            <strong className="text-ink">{summary.liveCount}</strong>
            {summary.allSdksPresent ? " · all packages present" : ""}
          </p>
        )}
        {loadingSponsors ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Probing sponsor clients…
          </p>
        ) : (
          <ul className="space-y-3">
            {sponsors.map((s) => (
              <li key={s.id} className="rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    {s.name}{" "}
                    <span className="mono text-[10px] text-muted">{s.package}</span>
                  </p>
                  <span className={`mono text-[10px] uppercase tracking-wider ${stateColor(s.state)}`}>
                    {s.state.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{s.role}</p>
                <p className="mt-1 text-sm text-ink/80">{s.detail}</p>
                {s.lastError && (
                  <p className="mt-1 mono text-[11px] text-warn">{s.lastError}</p>
                )}
                <p className="mt-1 mono text-[10px] text-muted">
                  env: {s.envVars.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn btn-ghost" type="button" onClick={() => void loadSponsors()}>
            Refresh status
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => void onSnykScan()}
            disabled={snykBusy}
          >
            {snykBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Run Snyk scan
          </button>
        </div>
        {snykMsg && <p className="text-sm text-muted">{snykMsg}</p>}
      </div>

      <div className="panel max-w-3xl space-y-3 border border-amber-800/40 p-5">
        <h2 className="display text-xl">Mode: DEMO by default</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>
            Set <code className="mono text-accent">CONTINUUM_MODE=connected</code> only when you
            intend live connectors.
          </li>
          <li>
            Copy <code className="mono text-accent">.env.example</code> →{" "}
            <code className="mono text-accent">.env.local</code> and fill sponsor keys.
          </li>
          <li>Secrets never leave the server — this UI only shows connection status.</li>
        </ul>
      </div>

      <div className="panel max-w-3xl space-y-3 p-5">
        <h2 className="display text-xl">Demo controls</h2>
        <p className="text-sm text-muted">
          Reset restores the Northstar / Acme seed graph for this workspace and clears prior motion
          runs and jobs.
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

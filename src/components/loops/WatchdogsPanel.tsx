"use client";

import { useState } from "react";
import { Loader2, Radar, Shield } from "lucide-react";
import { scanWatchdogs, toggleWatchdog } from "@/lib/hooks";
import type { WatchdogRule } from "@/lib/types";

export function WatchdogsPanel({
  watchdogs,
  hits,
  onChange,
}: {
  watchdogs: WatchdogRule[];
  hits: { ruleId: string; ruleName: string; loopId: string; loopTitle: string; reason: string }[];
  onChange: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function onScan() {
    setScanning(true);
    setLastResult(null);
    try {
      const res = await scanWatchdogs(true);
      const queued = res.queued?.length ?? 0;
      setLastResult(
        `Scan complete · ${res.hits?.length ?? 0} hit(s) · queued ${queued} Motion run(s)`,
      );
      onChange();
    } catch (e) {
      setLastResult(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function onToggle(rule: WatchdogRule) {
    setToggling(rule.id);
    try {
      await toggleWatchdog(rule.id, !rule.enabled);
      onChange();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-memory" />
            <h2 className="display text-xl">Watchdogs</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            LaserData-style proactive triggers. Enable rules, then Scan now to auto-queue Motion.
          </p>
        </div>
        <button className="btn btn-ghost text-sm" onClick={() => void onScan()} disabled={scanning}>
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Scan now
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {watchdogs.map((rule) => (
          <div
            key={rule.id}
            className="flex items-start justify-between gap-3 border border-line bg-bg px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold">{rule.name}</div>
              <p className="mt-0.5 text-xs text-muted">{rule.description}</p>
              <div className="mt-1 mono text-[10px] text-faint">
                fired {rule.fireCount}×
                {rule.lastFiredAt ? ` · last ${new Date(rule.lastFiredAt).toLocaleTimeString()}` : ""}
              </div>
            </div>
            <button
              className={`chip cursor-pointer shrink-0 ${rule.enabled ? "border-accent text-accent" : ""}`}
              disabled={toggling === rule.id}
              onClick={() => void onToggle(rule)}
            >
              {toggling === rule.id ? "…" : rule.enabled ? "on" : "off"}
            </button>
          </div>
        ))}
      </div>

      {hits.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="mono mb-2 text-[10px] uppercase tracking-[0.14em] text-muted">
            Active hits
          </div>
          <div className="space-y-1.5">
            {hits.slice(0, 4).map((h) => (
              <div key={`${h.ruleId}-${h.loopId}`} className="text-xs text-muted">
                <span className="text-ink">{h.ruleName}</span> → {h.loopTitle}{" "}
                <span className="text-faint">({h.reason})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastResult && <p className="mt-3 text-xs text-accent">{lastResult}</p>}
    </div>
  );
}

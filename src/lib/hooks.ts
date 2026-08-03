"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DebtMetrics,
  GraphSnapshot,
  MotionRun,
  OpenLoop,
  WatchdogRule,
} from "./types";

export function useSnapshot(pollMs = 0) {
  const [data, setData] = useState<GraphSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/memory", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load memory");
      const json = (await res.json()) as GraphSnapshot;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!pollMs) return;
    const t = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { data, loading, error, refresh };
}

export function useMetrics(pollMs = 2000) {
  const [metrics, setMetrics] = useState<DebtMetrics | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/metrics", { cache: "no-store" });
    if (!res.ok) return;
    setMetrics((await res.json()) as DebtMetrics);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { metrics, refresh };
}

export function useWatchdogs(pollMs = 4000) {
  const [watchdogs, setWatchdogs] = useState<WatchdogRule[]>([]);
  const [hits, setHits] = useState<
    { ruleId: string; ruleName: string; loopId: string; loopTitle: string; reason: string }[]
  >([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/watchdogs", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setWatchdogs(json.watchdogs ?? []);
    setHits(json.hits ?? []);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { watchdogs, hits, refresh, setWatchdogs };
}

export function useRun(runId: string | null, pollMs = 800) {
  const [run, setRun] = useState<MotionRun | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const tick = async () => {
      const res = await fetch(`/api/runs?id=${runId}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as MotionRun;
      if (!cancelled) setRun(json);
    };
    void tick();
    const t = setInterval(() => void tick(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [runId, pollMs]);

  return run;
}

export async function startRun(loopId: string, trigger: "manual" | "morning" | "watchdog" = "manual") {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loopId, trigger }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to start run");
  }
  return (await res.json()) as MotionRun;
}

export async function closeMyMorning(limit = 2) {
  const res = await fetch("/api/morning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit }),
  });
  if (!res.ok) throw new Error("Close My Morning failed");
  return res.json() as Promise<{
    message: string;
    runs: { runId?: string; loopId: string; title: string; error?: string }[];
  }>;
}

export async function scanWatchdogs(autoQueue = true) {
  const res = await fetch("/api/watchdogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ autoQueue, limit: 2 }),
  });
  if (!res.ok) throw new Error("Watchdog scan failed");
  return res.json();
}

export async function toggleWatchdog(id: string, enabled: boolean) {
  const res = await fetch("/api/watchdogs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, patch: { enabled } }),
  });
  if (!res.ok) throw new Error("Failed to update watchdog");
  return res.json();
}

export async function ingestResidue(text: string) {
  const res = await fetch("/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source: "manual" }),
  });
  if (!res.ok) throw new Error("Ingest failed");
  return res.json() as Promise<{ loop: OpenLoop; eventId: string }>;
}

export async function resetMemory() {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset" }),
  });
  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}

export async function createMemory(payload: {
  kind: string;
  title: string;
  summary: string;
  tags?: string[];
}) {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}

export async function searchMemory(q: string) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Search failed");
  return res.json() as Promise<{
    hits: {
      node: { id: string; title: string; kind: string; summary: string };
      score: number;
      reason: string;
    }[];
  }>;
}

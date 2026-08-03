"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Search,
  Sunrise,
} from "lucide-react";
import { MemoryGraphView } from "@/components/graph/MemoryGraphView";
import { DebtDashboard } from "@/components/loops/DebtDashboard";
import { WatchdogsPanel } from "@/components/loops/WatchdogsPanel";
import {
  closeMyMorning,
  searchMemory,
  startRun,
  useMetrics,
  useSnapshot,
  useWatchdogs,
} from "@/lib/hooks";
import type { MemoryNode, OpenLoop } from "@/lib/types";
import { formatRelative, priorityLabel } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CommandPage() {
  const { data, loading, refresh } = useSnapshot(2500);
  const { metrics, refresh: refreshMetrics } = useMetrics(2000);
  const { watchdogs, hits, refresh: refreshWatchdogs } = useWatchdogs(4000);
  const [selected, setSelected] = useState<MemoryNode | null>(null);
  const [query, setQuery] = useState("");
  const [hitsSearch, setHitsSearch] = useState<
    { title: string; kind: string; summary: string; score: number; reason: string }[]
  >([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [morningBusy, setMorningBusy] = useState(false);
  const [morningMsg, setMorningMsg] = useState<string | null>(null);
  const router = useRouter();

  const openLoops = useMemo(
    () => data?.loops.filter((l) => l.status === "open" || l.status === "running") ?? [],
    [data],
  );

  async function onSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setHitsSearch([]);
      return;
    }
    const res = await searchMemory(q);
    setHitsSearch(
      res.hits.map((h) => ({
        title: h.node.title,
        kind: h.node.kind,
        summary: h.node.summary,
        score: h.score,
        reason: h.reason,
      })),
    );
  }

  async function closeLoop(loop: OpenLoop) {
    setRunningId(loop.id);
    try {
      const run = await startRun(loop.id);
      await refresh();
      await refreshMetrics();
      router.push(`/app/runs?id=${run.id}`);
    } finally {
      setRunningId(null);
    }
  }

  async function onMorning() {
    setMorningBusy(true);
    setMorningMsg(null);
    try {
      const res = await closeMyMorning(2);
      setMorningMsg(res.message);
      await refresh();
      await refreshMetrics();
      const first = res.runs.find((r) => r.runId);
      if (first?.runId) router.push(`/app/runs?id=${first.runId}`);
    } catch (e) {
      setMorningMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setMorningBusy(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Open Loop OS…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Command</p>
          <h1 className="display mt-1 text-3xl md:text-4xl">Burn Open Loop Debt</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Continuum is the Open Loop OS — durable team memory that measures unfinished work,
            then runs Cited Motion to close it and write results back.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => void onMorning()} disabled={morningBusy}>
            {morningBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sunrise className="h-4 w-4" />
            )}
            Close My Morning
          </button>
          <Link href="/app/loops" className="btn btn-motion">
            Open loops
          </Link>
        </div>
      </div>

      {morningMsg && <p className="text-sm text-accent">{morningMsg}</p>}

      <DebtDashboard metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="display text-xl">Memory graph</h2>
            <Link href="/app/memory" className="text-sm text-muted hover:text-ink">
              Explore <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          <MemoryGraphView
            nodes={data?.nodes ?? []}
            edges={data?.edges ?? []}
            height={460}
            onSelect={setSelected}
          />
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel p-4"
            >
              <div className="mono text-[10px] uppercase tracking-[0.16em] text-memory">
                {selected.kind}
              </div>
              <div className="mt-1 text-lg font-semibold">{selected.title}</div>
              <p className="mt-2 text-sm text-muted">{selected.summary}</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <WatchdogsPanel
            watchdogs={watchdogs}
            hits={hits}
            onChange={() => {
              void refresh();
              void refreshWatchdogs();
              void refreshMetrics();
            }}
          />

          <div className="panel p-4">
            <label className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Search memory
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                className="field pl-10"
                placeholder="Acme, Maya, RFC, renewal…"
                value={query}
                onChange={(e) => void onSearch(e.target.value)}
              />
            </div>
            {hitsSearch.length > 0 && (
              <div className="mt-3 max-h-36 space-y-2 overflow-auto scroll-thin">
                {hitsSearch.map((h) => (
                  <div key={h.title + h.kind} className="border border-line bg-bg px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{h.title}</span>
                      <span className="chip">{h.kind}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{h.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="display text-xl">Priority loops</h2>
              <Link href="/app/loops" className="text-sm text-muted hover:text-ink">
                All
              </Link>
            </div>
            <div className="space-y-3">
              {openLoops.slice(0, 3).map((loop) => (
                <div key={loop.id} className="border border-line bg-bg p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip">{priorityLabel(loop.priority)}</span>
                    <span className="chip">
                      {loop.status === "running" ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> running
                        </>
                      ) : (
                        <>
                          <CircleDashed className="h-3 w-3" /> {loop.status}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-snug">{loop.title}</div>
                  <p className="mt-1 text-xs text-muted line-clamp-2">{loop.summary}</p>
                  <button
                    className="btn btn-motion mt-3 w-full text-sm"
                    disabled={runningId === loop.id || loop.status === "running"}
                    onClick={() => void closeLoop(loop)}
                  >
                    {runningId === loop.id || loop.status === "running" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Closing…
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4" /> Close with Cited Motion
                      </>
                    )}
                  </button>
                </div>
              ))}
              {openLoops.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Open Loop Debt cleared. Reset seed or ingest
                  residue.
                </div>
              )}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="display text-xl">Recent motion</h2>
            <div className="mt-3 space-y-2">
              {(data?.runs ?? []).slice(0, 3).map((run) => (
                <Link
                  key={run.id}
                  href={`/app/runs?id=${run.id}`}
                  className="flex items-center justify-between border border-line bg-bg px-3 py-2 text-sm hover:border-line-strong"
                >
                  <span className="truncate pr-3">{run.title}</span>
                  <span className="chip shrink-0">
                    {run.status}
                    {run.debtAfter != null ? ` · ${run.debtBefore}→${run.debtAfter}` : ""}
                  </span>
                </Link>
              ))}
              {(data?.runs.length ?? 0) === 0 && (
                <p className="text-sm text-muted">No runs yet. Close My Morning or pick a loop.</p>
              )}
              {data?.runs[0] && (
                <p className="mono text-[10px] text-faint">
                  Last activity {formatRelative(data.runs[0].startedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

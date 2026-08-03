"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CircleDashed,
  Loader2,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { closeMyMorning, ingestResidue, startRun, useSnapshot } from "@/lib/hooks";
import type { OpenLoop } from "@/lib/types";
import { formatRelative, priorityLabel } from "@/lib/utils";

export default function LoopsPage() {
  const { data, loading, refresh } = useSnapshot(2000);
  const [filter, setFilter] = useState<"all" | "open" | "running" | "closed" | "blocked">("all");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [residue, setResidue] = useState(
    "Maya asked for a Friday brief on Acme renewal risk. Sam still needs owners for the onboarding playbook gaps.",
  );
  const [ingesting, setIngesting] = useState(false);
  const [morningBusy, setMorningBusy] = useState(false);
  const [morningMsg, setMorningMsg] = useState<string | null>(null);
  const router = useRouter();

  const loops = useMemo(() => {
    const list = data?.loops ?? [];
    if (filter === "all") return list;
    return list.filter((l) => l.status === filter);
  }, [data, filter]);

  async function closeLoop(loop: OpenLoop) {
    setRunningId(loop.id);
    try {
      const run = await startRun(loop.id);
      await refresh();
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
      const first = res.runs.find((r) => r.runId);
      if (first?.runId) router.push(`/app/runs?id=${first.runId}`);
    } catch (e) {
      setMorningMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setMorningBusy(false);
    }
  }

  async function onIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!residue.trim()) return;
    setIngesting(true);
    try {
      await ingestResidue(residue.trim());
      setResidue("");
      await refresh();
      setFilter("open");
    } finally {
      setIngesting(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading loops…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Open Loops</p>
        <h1 className="display mt-1 text-3xl md:text-4xl">Work that still owes motion</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every unfinished commitment becomes a first-class loop with context, priority, and a
          one-click Motion pipeline.
        </p>
      </div>

      <form onSubmit={onIngest} className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="display text-xl">Ingest residue → open loop</h2>
          </div>
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={morningBusy}
            onClick={() => void onMorning()}
          >
            {morningBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sunrise className="h-4 w-4" />}
            Close My Morning
          </button>
        </div>
        <p className="text-sm text-muted">
          Paste meeting notes or a standup dump. Continuum materializes an event + open loop into
          the graph — increasing measurable Open Loop Debt until Motion closes it.
        </p>
        <textarea
          className="field min-h-[110px] resize-y"
          value={residue}
          onChange={(e) => setResidue(e.target.value)}
          placeholder="What still needs to happen?"
        />
        <button className="btn btn-ghost" disabled={ingesting || !residue.trim()}>
          {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Extract open loop
        </button>
        {morningMsg && <p className="text-xs text-accent">{morningMsg}</p>}
      </form>

      <div className="flex flex-wrap gap-2">
        {(["all", "open", "running", "blocked", "closed"] as const).map((f) => (
          <button
            key={f}
            className={`chip cursor-pointer ${filter === f ? "border-accent text-accent" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loops.map((loop) => (
          <article key={loop.id} className="panel flex flex-col p-4">
            <div className="flex flex-wrap gap-2">
              <span className="chip">{priorityLabel(loop.priority)}</span>
              <span className="chip">
                <CircleDashed className="h-3 w-3" /> {loop.status}
              </span>
              <span className="chip">{formatRelative(loop.updatedAt)}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-snug">{loop.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted">{loop.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {loop.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="mono mb-2 text-[10px] uppercase tracking-[0.14em] text-faint">
                Suggested motion
              </div>
              <ul className="space-y-1 text-xs text-muted">
                {loop.suggestedActions.map((a) => (
                  <li key={a}>→ {a}</li>
                ))}
              </ul>
            </div>
            <button
              className="btn btn-motion mt-4 w-full"
              disabled={
                runningId === loop.id ||
                loop.status === "running" ||
                loop.status === "closed"
              }
              onClick={() => void closeLoop(loop)}
            >
              {runningId === loop.id || loop.status === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Motion running…
                </>
              ) : loop.status === "closed" ? (
                "Already closed"
              ) : (
                <>
                  <Activity className="h-4 w-4" /> Close with Motion
                </>
              )}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

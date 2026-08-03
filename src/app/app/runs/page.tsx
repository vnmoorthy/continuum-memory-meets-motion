"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRun, useSnapshot } from "@/lib/hooks";
import { cn, formatRelative } from "@/lib/utils";
import type { MotionRun, MotionStep } from "@/lib/types";

function StepIcon({ status }: { status: MotionStep["status"] }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-danger" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-accent" />;
  return <Circle className="h-4 w-4 text-faint" />;
}

function RunDetail({ run }: { run: MotionRun }) {
  const [activeArtifact, setActiveArtifact] = useState(0);
  const artifact = run.artifacts[activeArtifact];

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <div className="panel p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{run.status}</span>
            <span className="chip">{formatRelative(run.startedAt)}</span>
            <span className="chip">{run.pipeline}</span>
          </div>
          <h2 className="display mt-3 text-2xl">{run.title}</h2>
          {run.summary && <p className="mt-2 text-sm text-muted">{run.summary}</p>}
        </div>

        <div className="panel p-4">
          <h3 className="display text-xl">Pipeline steps</h3>
          <ol className="mt-4 space-y-3">
            {run.steps.map((step) => (
              <li key={step.id} className="flex gap-3 border border-line bg-bg p-3">
                <StepIcon status={step.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{step.name}</span>
                    <span className="chip">{step.kind}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="panel p-4">
          <h3 className="display text-xl">Event stream</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto scroll-thin">
            {run.events.map((ev) => (
              <div key={ev.id} className="border border-line bg-bg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "chip",
                      ev.level === "success" && "text-success",
                      ev.level === "error" && "text-danger",
                      ev.level === "warn" && "text-warn",
                    )}
                  >
                    {ev.level}
                  </span>
                  <span className="mono text-[10px] text-faint">
                    {new Date(ev.ts).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{ev.message}</p>
              </div>
            ))}
            {run.events.length === 0 && (
              <p className="text-sm text-muted">Waiting for stream events…</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel flex min-h-[420px] flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="display text-xl">Artifacts</h3>
          <div className="flex gap-1">
            {run.artifacts.map((a, i) => (
              <button
                key={a.id}
                className={cn(
                  "chip cursor-pointer",
                  i === activeArtifact && "border-accent text-accent",
                )}
                onClick={() => setActiveArtifact(i)}
              >
                {a.kind}
              </button>
            ))}
          </div>
        </div>
        {artifact ? (
          <div className="mt-4 flex flex-1 flex-col">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              <FileText className="h-4 w-4" /> {artifact.title}
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap border border-line bg-bg p-4 text-sm leading-relaxed text-ink scroll-thin">
              {artifact.content}
            </pre>
          </div>
        ) : (
          <div className="mt-10 flex flex-1 flex-col items-center justify-center text-muted">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-accent" />
            Motion is producing an artifact…
          </div>
        )}

        <div className="mt-4 border-t border-line pt-3">
          <div className="mono mb-2 text-[10px] uppercase tracking-[0.14em] text-faint">
            Memory used · citations
          </div>
          <div className="flex flex-wrap gap-1">
            {(run.citations?.length
              ? run.citations
              : run.memoryUsed.map((id) => ({
                  nodeId: id,
                  title: id,
                  kind: "artifact" as const,
                }))
            ).map((c) => (
              <span key={c.nodeId} className="chip">
                {c.title}
              </span>
            ))}
          </div>
          {run.debtBefore != null && (
            <p className="mt-3 text-xs text-muted">
              Debt {run.debtBefore}
              {run.debtAfter != null ? ` → ${run.debtAfter}` : ""}
              {run.dollarsFreed != null
                ? ` · freed ~$${Math.round(run.dollarsFreed / 1000)}k attribution`
                : ""}
              {run.trigger ? ` · trigger: ${run.trigger}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RunsInner() {
  const params = useSearchParams();
  const selectedId = params.get("id");
  const { data, loading } = useSnapshot(1500);
  const liveRun = useRun(selectedId);
  const runs = data?.runs ?? [];

  const active = useMemo(() => {
    if (liveRun) return liveRun;
    if (selectedId) return runs.find((r) => r.id === selectedId) ?? null;
    return runs[0] ?? null;
  }, [liveRun, selectedId, runs]);

  if (loading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading motion…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Motion</p>
        <h1 className="display mt-1 text-3xl md:text-4xl">Autonomous loop closure</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          RocketRide-compatible pipeline execution with LaserData-style live streams and
          memory write-back.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="panel max-h-[70vh] overflow-auto p-3 scroll-thin">
          <div className="mono mb-2 px-1 text-[10px] uppercase tracking-[0.16em] text-muted">
            Runs
          </div>
          <div className="space-y-2">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/app/runs?id=${run.id}`}
                className={cn(
                  "block border px-3 py-2 transition-colors",
                  active?.id === run.id
                    ? "border-accent bg-bg"
                    : "border-line bg-transparent hover:border-line-strong",
                )}
              >
                <div className="truncate text-sm font-medium">{run.title}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="chip">{run.status}</span>
                  <span className="mono text-[10px] text-faint">
                    {formatRelative(run.startedAt)}
                  </span>
                </div>
              </Link>
            ))}
            {runs.length === 0 && (
              <p className="px-1 text-sm text-muted">
                No runs yet.{" "}
                <Link href="/app/loops" className="text-accent">
                  Close a loop
                </Link>
                .
              </p>
            )}
          </div>
        </aside>

        <div>
          {active ? (
            <RunDetail run={active} />
          ) : (
            <div className="panel flex h-[420px] items-center justify-center text-muted">
              Select or start a motion run.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RunsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading motion…
        </div>
      }
    >
      <RunsInner />
    </Suspense>
  );
}

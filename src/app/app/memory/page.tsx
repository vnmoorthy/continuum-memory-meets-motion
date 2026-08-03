"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { MemoryGraphView } from "@/components/graph/MemoryGraphView";
import { createMemory, useSnapshot } from "@/lib/hooks";
import type { MemoryNode, NodeKind } from "@/lib/types";

const kinds: NodeKind[] = ["person", "project", "decision", "artifact", "goal", "event"];

export default function MemoryPage() {
  const { data, loading, refresh } = useSnapshot();
  const [selected, setSelected] = useState<MemoryNode | null>(null);
  const [filter, setFilter] = useState<NodeKind | "all">("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    kind: "artifact" as NodeKind,
    title: "",
    summary: "",
    tags: "",
  });

  const nodes = useMemo(() => {
    const list = data?.nodes ?? [];
    return filter === "all" ? list : list.filter((n) => n.kind === filter);
  }, [data, filter]);

  const edges = useMemo(() => {
    if (!data) return [];
    const ids = new Set(nodes.map((n) => n.id));
    return data.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [data, nodes]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await createMemory({
        kind: form.kind,
        title: form.title.trim(),
        summary: form.summary.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setForm({ kind: "artifact", title: "", summary: "", tags: "" });
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading graph…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Memory</p>
        <h1 className="display mt-1 text-3xl md:text-4xl">Durable knowledge graph</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          FalkorDB-style relationship memory. Filter by kind, inspect nodes, or add new
          entities that Motion can use later.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={`chip cursor-pointer ${filter === "all" ? "border-accent text-accent" : ""}`}
          onClick={() => setFilter("all")}
        >
          all ({data?.nodes.length ?? 0})
        </button>
        {kinds.map((k) => (
          <button
            key={k}
            className={`chip cursor-pointer ${filter === k ? "border-accent text-accent" : ""}`}
            onClick={() => setFilter(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <MemoryGraphView nodes={nodes} edges={edges} height={560} onSelect={setSelected} />

        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="display text-xl">Selected</h2>
            {selected ? (
              <div className="mt-3 space-y-2">
                <div className="chip">{selected.kind}</div>
                <div className="text-lg font-semibold">{selected.title}</div>
                <p className="text-sm text-muted">{selected.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
                <pre className="mono mt-3 overflow-auto border border-line bg-bg p-3 text-[11px] text-muted scroll-thin">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Click a node in the graph.</p>
            )}
          </div>

          <form onSubmit={onCreate} className="panel space-y-3 p-4">
            <h2 className="display text-xl">Add memory</h2>
            <select
              className="field"
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as NodeKind }))}
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <textarea
              className="field min-h-[90px] resize-y"
              placeholder="Summary"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
            <input
              className="field"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
            <button className="btn btn-primary w-full" disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Save to graph
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

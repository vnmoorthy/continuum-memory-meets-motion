"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import type { MemoryEdge, MemoryNode, NodeKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindColor: Record<NodeKind, string> = {
  person: "#5ec8c0",
  project: "#e4ff5c",
  decision: "#f0c14d",
  artifact: "#e8956c",
  loop: "#ff7a8a",
  event: "#9aa3b0",
  goal: "#7dffb3",
};

function GraphNode({ data }: NodeProps) {
  const kind = (data.kind as NodeKind) ?? "artifact";
  const color = kindColor[kind];
  return (
    <div
      className={cn(
        "min-w-[150px] max-w-[190px] border px-3 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)]",
        data.selected ? "border-accent" : "border-line-strong",
      )}
      style={{
        background: `color-mix(in oklab, ${color} 16%, #0e1218)`,
        borderRadius: 2,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted !border-none !w-2 !h-2" />
      <div className="mono mb-1 text-[9px] uppercase tracking-[0.16em]" style={{ color }}>
        {kind}
      </div>
      <div className="text-[12px] font-semibold leading-snug text-ink">{String(data.label)}</div>
      <Handle type="source" position={Position.Right} className="!bg-muted !border-none !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { continuum: GraphNode };

function layout(nodes: MemoryNode[]) {
  const byKind: Record<string, MemoryNode[]> = {};
  for (const n of nodes) {
    (byKind[n.kind] ??= []).push(n);
  }
  const kinds = Object.keys(byKind);
  const positioned: Node[] = [];
  kinds.forEach((kind, col) => {
    byKind[kind].forEach((n, row) => {
      positioned.push({
        id: n.id,
        type: "continuum",
        position: { x: col * 230 + (row % 2) * 24, y: row * 100 },
        data: { label: n.title, kind: n.kind, summary: n.summary },
      });
    });
  });
  return positioned;
}

export function MemoryGraphView({
  nodes,
  edges,
  height = 520,
  onSelect,
}: {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  height?: number;
  onSelect?: (node: MemoryNode | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const flowNodes = useMemo(() => {
    const base = layout(nodes);
    return base.map((n) => ({
      ...n,
      data: { ...n.data, selected: n.id === selected },
    }));
  }, [nodes, selected]);

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label ?? e.kind.replace("_", " "),
        animated: e.kind === "closes" || e.kind === "produced",
        style: { stroke: "rgba(243,239,231,0.25)", strokeWidth: 1.2 },
        labelStyle: { fill: "#8f96a3", fontSize: 9 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(243,239,231,0.35)", width: 14, height: 14 },
      })),
    [edges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelected(node.id);
      const found = nodes.find((n) => n.id === node.id) ?? null;
      onSelect?.(found);
    },
    [nodes, onSelect],
  );

  useEffect(() => {
    if (!selected && nodes[0]) {
      // keep idle until click
    }
  }, [selected, nodes]);

  return (
    <div className="panel overflow-hidden" style={{ height }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.35}
        maxZoom={1.6}
        onNodeClick={onNodeClick}
        onPaneClick={() => {
          setSelected(null);
          onSelect?.(null);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} size={1} color="rgba(243,239,231,0.06)" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(10,12,15,0.75)"
          nodeColor={(n) => kindColor[(n.data?.kind as NodeKind) ?? "artifact"]}
          style={{ background: "#11151b", border: "1px solid rgba(243,239,231,0.1)" }}
        />
        <Controls
          showInteractive={false}
          className="!bg-bg-elevated !border-line-strong !shadow-none [&>button]:!bg-bg-soft [&>button]:!border-line [&>button]:!fill-ink"
        />
      </ReactFlow>
    </div>
  );
}

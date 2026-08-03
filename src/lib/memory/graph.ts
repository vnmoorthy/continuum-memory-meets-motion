import { getSnapshot } from "../store/db";
import type { MemoryNode, OpenLoop, SearchHit } from "../types";

export async function getMemorySubgraph(workspaceId: string, seedIds: string[], depth = 1) {
  const db = await getSnapshot(workspaceId);
  const include = new Set(seedIds);
  for (let d = 0; d < depth; d++) {
    const frontier = [...include];
    for (const id of frontier) {
      for (const e of db.edges) {
        if (e.source === id) include.add(e.target);
        if (e.target === id) include.add(e.source);
      }
    }
  }
  const nodes = db.nodes.filter((n) => include.has(n.id));
  const edges = db.edges.filter((e) => include.has(e.source) && include.has(e.target));
  return { nodes, edges };
}

export async function searchMemory(
  workspaceId: string,
  query: string,
  limit = 8,
): Promise<SearchHit[]> {
  const db = await getSnapshot(workspaceId);
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);
  const scored = db.nodes
    .map((node) => {
      const hay = `${node.title} ${node.summary} ${node.tags.join(" ")} ${node.kind}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (hay.includes(t)) score += 2;
        if (node.title.toLowerCase().includes(t)) score += 3;
        if (node.tags.some((tag) => tag.includes(t))) score += 1.5;
      }
      if (node.kind === "loop" && (node as OpenLoop).status === "open") score += 0.5;
      const reason =
        score > 0
          ? `Matched ${terms.filter((t) => hay.includes(t)).join(", ") || "semantic proximity"}`
          : "";
      return { node, score, reason };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function formatContextPack(nodes: MemoryNode[]) {
  return nodes
    .map(
      (n) =>
        `## [${n.kind.toUpperCase()}] ${n.title}\n${n.summary}\nTags: ${n.tags.join(", ") || "none"}`,
    )
    .join("\n\n");
}

/** Cypher-flavored queries for FalkorDB parity demos */
export function toCypherCreate(node: MemoryNode) {
  const props = {
    id: node.id,
    title: node.title,
    summary: node.summary,
    tags: node.tags,
    kind: node.kind,
  };
  return `CREATE (:${capitalize(node.kind)} ${cypherMap(props)})`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cypherMap(obj: Record<string, unknown>) {
  const body = Object.entries(obj)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");
  return `{${body}}`;
}

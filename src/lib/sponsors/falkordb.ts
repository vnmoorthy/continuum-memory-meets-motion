import { sponsorEnv } from "./env";
import type { SponsorStatus } from "./types";
import type { MemoryEdge, MemoryNode } from "../types";

type FalkorClient = {
  selectGraph: (name: string) => {
    query: (cypher: string) => Promise<unknown>;
  };
};

let cached: FalkorClient | null = null;

export async function falkorStatus(): Promise<SponsorStatus> {
  const configured = sponsorEnv.falkordb.configured();
  const now = new Date().toISOString();
  let sdkLoaded = false;
  try {
    await import("falkordb");
    sdkLoaded = true;
  } catch (err) {
    return {
      id: "falkordb",
      name: "FalkorDB",
      package: "falkordb",
      role: "Property-graph memory mirror (OpenCypher)",
      sdkLoaded: false,
      envVars: ["FALKORDB_HOST", "FALKORDB_PORT", "FALKORDB_PASSWORD"],
      lastCheckedAt: now,
      configured,
      state: "not_configured",
      live: false,
      detail: "Failed to load falkordb package.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }

  const base = {
    id: "falkordb" as const,
    name: "FalkorDB",
    package: "falkordb",
    role: "Property-graph memory mirror (OpenCypher)",
    sdkLoaded,
    envVars: ["FALKORDB_HOST", "FALKORDB_PORT", "FALKORDB_PASSWORD"],
    lastCheckedAt: now,
    configured,
  };

  if (!configured) {
    return {
      ...base,
      state: "not_configured",
      live: false,
      detail:
        "SDK loaded. SQLite is primary store. Set FALKORDB_HOST to mirror writes into FalkorDB.",
    };
  }

  try {
    const db = await getFalkor();
    const graph = db.selectGraph("Continuum");
    await graph.query("RETURN 1");
    return {
      ...base,
      state: "live",
      live: true,
      detail: `Connected to ${sponsorEnv.falkordb.host()}:${sponsorEnv.falkordb.port()} graph Continuum.`,
    };
  } catch (err) {
    return {
      ...base,
      state: "configured_unreachable",
      live: false,
      detail: "Host configured but FalkorDB probe failed.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }
}

async function getFalkor(): Promise<FalkorClient> {
  if (cached) return cached;
  const { FalkorDB } = await import("falkordb");
  const host = sponsorEnv.falkordb.host();
  const port = sponsorEnv.falkordb.port();
  cached = (await FalkorDB.connect({
    socket: { host, port },
    password: sponsorEnv.falkordb.password(),
  })) as unknown as FalkorClient;
  return cached;
}

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function mirrorNodeToFalkor(node: MemoryNode): Promise<{ mirrored: boolean; error?: string }> {
  if (!sponsorEnv.falkordb.configured()) return { mirrored: false };
  try {
    const db = await getFalkor();
    const graph = db.selectGraph("Continuum");
    const label = node.kind.charAt(0).toUpperCase() + node.kind.slice(1);
    await graph.query(
      `MERGE (n:${label} {id: '${esc(node.id)}'})
       SET n.title = '${esc(node.title)}',
           n.summary = '${esc(node.summary.slice(0, 500))}',
           n.kind = '${esc(node.kind)}',
           n.updatedAt = '${esc(node.updatedAt)}'`,
    );
    return { mirrored: true };
  } catch (err) {
    return { mirrored: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function mirrorEdgeToFalkor(edge: MemoryEdge): Promise<{ mirrored: boolean; error?: string }> {
  if (!sponsorEnv.falkordb.configured()) return { mirrored: false };
  try {
    const db = await getFalkor();
    const graph = db.selectGraph("Continuum");
    const rel = edge.kind.toUpperCase();
    await graph.query(
      `MATCH (a {id: '${esc(edge.source)}'}), (b {id: '${esc(edge.target)}'})
       MERGE (a)-[r:${rel} {id: '${esc(edge.id)}'}]->(b)
       SET r.weight = ${edge.weight}`,
    );
    return { mirrored: true };
  } catch (err) {
    return { mirrored: false, error: err instanceof Error ? err.message : String(err) };
  }
}

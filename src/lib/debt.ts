import type {
  DebtLoopBreakdown,
  DebtMetrics,
  GraphSnapshot,
  MemoryNode,
  OpenLoop,
} from "./types";

function parseDollars(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Dollars at risk attributed to a loop via its own metadata or linked projects. */
export function dollarsForLoop(loop: OpenLoop, nodes: MemoryNode[]): number {
  const own = parseDollars(loop.metadata.arr ?? loop.metadata.dollarsAtRisk ?? loop.metadata.value);
  if (own > 0) return own;

  let linked = 0;
  for (const id of loop.contextNodeIds) {
    const node = nodes.find((n) => n.id === id);
    if (!node) continue;
    linked = Math.max(
      linked,
      parseDollars(node.metadata.arr ?? node.metadata.dollarsAtRisk ?? node.metadata.value),
    );
  }
  // Soft defaults by tag so demos always show impact
  if (linked > 0) return linked;
  if (loop.tags.includes("customer") || loop.tags.includes("revenue")) return 220_000;
  if (loop.tags.includes("engineering") || loop.tags.includes("research")) return 48_000;
  if (loop.tags.includes("pilot") || loop.tags.includes("status")) return 48_000;
  return 12_000;
}

export function ageHours(iso: string, now = Date.now()) {
  return Math.max(0, (now - new Date(iso).getTime()) / 3_600_000);
}

export function hoursTrappedFor(loop: OpenLoop, ageH: number) {
  // Higher priority traps more focus hours as it ages
  const base = (6 - loop.priority) * 1.25;
  return Math.round((base + ageH * 0.15) * 10) / 10;
}

/**
 * Open Loop Debt score:
 * priorityWeight × ageFactor × dollarFactor (normalized)
 */
export function scoreLoop(loop: OpenLoop, nodes: MemoryNode[], now = Date.now()): DebtLoopBreakdown {
  const ageH = ageHours(loop.createdAt, now);
  const dollars = loop.status === "closed" ? 0 : dollarsForLoop(loop, nodes);
  const hours = loop.status === "closed" ? 0 : hoursTrappedFor(loop, ageH);
  const priorityWeight = 6 - loop.priority; // P1=5 … P5=1
  const ageFactor = 1 + Math.min(ageH / 24, 10) * 0.35;
  const dollarFactor = 1 + Math.log10(1 + dollars / 1000);
  const dueBoost =
    loop.dueAt && new Date(loop.dueAt).getTime() < now + 48 * 3_600_000 ? 1.35 : 1;
  const statusFactor = loop.status === "closed" ? 0 : loop.status === "blocked" ? 1.2 : 1;
  const score =
    loop.status === "closed"
      ? 0
      : Math.round(priorityWeight * ageFactor * dollarFactor * dueBoost * statusFactor * 10);

  return {
    loopId: loop.id,
    title: loop.title,
    status: loop.status,
    priority: loop.priority,
    ageHours: Math.round(ageH * 10) / 10,
    dollarsAtRisk: dollars,
    hoursTrapped: hours,
    score,
  };
}

export function computeDebtMetrics(snapshot: GraphSnapshot, now = Date.now()): DebtMetrics {
  const breakdown = snapshot.loops.map((l) => scoreLoop(l, snapshot.nodes, now));
  const open = breakdown.filter((b) => b.status !== "closed");
  const closed = breakdown.filter((b) => b.status === "closed");
  const score = open.reduce((s, b) => s + b.score, 0);
  const dollarsAtRisk = open.reduce((s, b) => s + b.dollarsAtRisk, 0);
  // Avoid double-counting shared ARR across related loops — take unique project ARR max grouping
  const uniqueDollars = uniqueRiskDollars(snapshot);
  const hoursTrapped = open.reduce((s, b) => s + b.hoursTrapped, 0);
  const avgAgeHours =
    open.length === 0 ? 0 : Math.round((open.reduce((s, b) => s + b.ageHours, 0) / open.length) * 10) / 10;
  const agingCritical = open.filter((b) => b.ageHours >= 48 && b.priority <= 2).length;

  const beforeScore = snapshot.debtBaseline || score;
  const afterScore = score;

  return {
    score,
    dollarsAtRisk: uniqueDollars > 0 ? uniqueDollars : dollarsAtRisk,
    hoursTrapped: Math.round(hoursTrapped * 10) / 10,
    openLoops: open.length,
    closedLoops: closed.length,
    avgAgeHours,
    agingCritical,
    beforeScore,
    afterScore,
    dollarsFreedLifetime: snapshot.dollarsFreedLifetime ?? 0,
    breakdown: breakdown.sort((a, b) => b.score - a.score),
    updatedAt: new Date(now).toISOString(),
  };
}

function uniqueRiskDollars(snapshot: GraphSnapshot) {
  const open = snapshot.loops.filter((l) => l.status !== "closed");
  const seen = new Set<string>();
  let total = 0;
  for (const loop of open) {
    const dollars = dollarsForLoop(loop, snapshot.nodes);
    // Key by primary project context if present
    const projectId =
      loop.contextNodeIds.find((id) => snapshot.nodes.find((n) => n.id === id)?.kind === "project") ??
      loop.id;
    const key = `${projectId}:${dollars}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total += dollars;
  }
  return total;
}

export function rankLoopsForMorning(snapshot: GraphSnapshot, limit = 2): OpenLoop[] {
  const metrics = computeDebtMetrics(snapshot);
  const openIds = new Set(
    snapshot.loops.filter((l) => l.status === "open" || l.status === "blocked").map((l) => l.id),
  );
  return metrics.breakdown
    .filter((b) => openIds.has(b.loopId))
    .slice(0, limit)
    .map((b) => snapshot.loops.find((l) => l.id === b.loopId)!)
    .filter(Boolean);
}

export function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
}

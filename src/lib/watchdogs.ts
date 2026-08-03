import type { GraphSnapshot, OpenLoop, WatchdogRule, WatchdogRuleId } from "./types";
import { ageHours, dollarsForLoop } from "./debt";

export function defaultWatchdogs(): WatchdogRule[] {
  return [
    {
      id: "stale",
      name: "Stale loop scanner",
      description: "Auto-queue Motion when an open loop is older than 36 hours.",
      enabled: true,
      fireCount: 0,
    },
    {
      id: "due_soon",
      name: "Due-soon interceptor",
      description: "Fire when a loop is due within 48 hours.",
      enabled: true,
      fireCount: 0,
    },
    {
      id: "high_priority",
      name: "P1/P2 guardian",
      description: "Immediately queue any open P1–P2 loop that isn’t running.",
      enabled: false,
      fireCount: 0,
    },
    {
      id: "revenue_risk",
      name: "Revenue risk watchdog",
      description: "Trigger when open loops touch ≥ $100k ARR metadata.",
      enabled: true,
      fireCount: 0,
    },
  ];
}

export function matchesWatchdog(
  rule: WatchdogRule,
  loop: OpenLoop,
  snapshot: GraphSnapshot,
  now = Date.now(),
): boolean {
  if (!rule.enabled) return false;
  if (loop.status !== "open" && loop.status !== "blocked") return false;

  switch (rule.id as WatchdogRuleId) {
    case "stale":
      return ageHours(loop.createdAt, now) >= 36;
    case "due_soon":
      return Boolean(loop.dueAt && new Date(loop.dueAt).getTime() <= now + 48 * 3_600_000);
    case "high_priority":
      return loop.priority <= 2;
    case "revenue_risk":
      return dollarsForLoop(loop, snapshot.nodes, snapshot) >= 100_000;
    default:
      return false;
  }
}

export interface WatchdogHit {
  ruleId: WatchdogRuleId;
  ruleName: string;
  loopId: string;
  loopTitle: string;
  reason: string;
}

export function scanWatchdogs(snapshot: GraphSnapshot, now = Date.now()): WatchdogHit[] {
  const hits: WatchdogHit[] = [];
  const rules = snapshot.watchdogs?.length ? snapshot.watchdogs : defaultWatchdogs();

  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const loop of snapshot.loops) {
      if (!matchesWatchdog(rule, loop, snapshot, now)) continue;
      hits.push({
        ruleId: rule.id,
        ruleName: rule.name,
        loopId: loop.id,
        loopTitle: loop.title,
        reason: reasonFor(rule.id, loop, snapshot, now),
      });
    }
  }

  // Dedupe by loop — keep first matching rule
  const seen = new Set<string>();
  return hits.filter((h) => {
    if (seen.has(h.loopId)) return false;
    seen.add(h.loopId);
    return true;
  });
}

function reasonFor(id: WatchdogRuleId, loop: OpenLoop, snapshot: GraphSnapshot, now: number) {
  if (id === "stale") return `Stale ${Math.round(ageHours(loop.createdAt, now))}h`;
  if (id === "due_soon") return `Due ${loop.dueAt ? new Date(loop.dueAt).toLocaleString() : "soon"}`;
  if (id === "high_priority") return `Priority P${loop.priority}`;
  if (id === "revenue_risk")
    return `$${Math.round(dollarsForLoop(loop, snapshot.nodes, snapshot) / 1000)}k ARR at risk`;
  return "Matched";
}

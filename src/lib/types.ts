export type NodeKind =
  | "person"
  | "project"
  | "decision"
  | "artifact"
  | "loop"
  | "event"
  | "goal";

export type LoopStatus = "open" | "running" | "blocked" | "closed";
export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type EdgeKind =
  | "owns"
  | "involves"
  | "blocks"
  | "depends_on"
  | "mentions"
  | "produced"
  | "closes"
  | "related";

export interface MemoryNode {
  id: string;
  kind: NodeKind;
  title: string;
  summary: string;
  tags: string[];
  status?: LoopStatus;
  priority?: 1 | 2 | 3 | 4 | 5;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  weight: number;
  label?: string;
  createdAt: string;
}

export interface OpenLoop extends MemoryNode {
  kind: "loop";
  status: LoopStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  dueAt?: string;
  contextNodeIds: string[];
  suggestedActions: string[];
  /** Canonical risk bucket — shared ARR must not double-count across loops. */
  riskEntityId?: string;
}

/** Unique financial risk attribution unit (e.g. one ARR renewal). */
export interface RiskEntity {
  id: string;
  label: string;
  dollars: number;
  sourceNodeId?: string;
}

export interface Citation {
  nodeId: string;
  title: string;
  kind: NodeKind;
}

export interface MotionStep {
  id: string;
  name: string;
  kind: "retrieve" | "reason" | "tool" | "write" | "notify";
  status: "pending" | "running" | "done" | "failed" | "skipped";
  detail: string;
  startedAt?: string;
  finishedAt?: string;
  output?: string;
}

export interface MotionRun {
  id: string;
  loopId: string;
  title: string;
  status: RunStatus;
  pipeline: string;
  steps: MotionStep[];
  events: StreamEvent[];
  memoryUsed: string[];
  artifacts: Artifact[];
  citations: Citation[];
  debtBefore?: number;
  debtAfter?: number;
  dollarsFreed?: number;
  trigger?: "manual" | "morning" | "watchdog";
  startedAt: string;
  finishedAt?: string;
  summary?: string;
  idempotencyKey?: string;
  workspaceId?: string;
  /** True when research/notify steps are simulated (demo mode). */
  simulated?: boolean;
  mode?: "demo" | "connected";
}

export interface Artifact {
  id: string;
  title: string;
  kind: "email" | "brief" | "checklist" | "note" | "research";
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface StreamEvent {
  id: string;
  runId: string;
  ts: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

export type WatchdogRuleId = "stale" | "due_soon" | "high_priority" | "revenue_risk";

export interface WatchdogRule {
  id: WatchdogRuleId;
  name: string;
  description: string;
  enabled: boolean;
  lastFiredAt?: string;
  fireCount: number;
}

export interface DebtLoopBreakdown {
  loopId: string;
  title: string;
  status: LoopStatus;
  priority: number;
  ageHours: number;
  dollarsAtRisk: number;
  hoursTrapped: number;
  score: number;
}

export interface DebtMetrics {
  score: number;
  dollarsAtRisk: number;
  hoursTrapped: number;
  openLoops: number;
  closedLoops: number;
  avgAgeHours: number;
  agingCritical: number;
  beforeScore: number;
  afterScore: number;
  dollarsFreedLifetime: number;
  breakdown: DebtLoopBreakdown[];
  updatedAt: string;
}

export interface GraphSnapshot {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  loops: OpenLoop[];
  runs: MotionRun[];
  watchdogs: WatchdogRule[];
  riskEntities: RiskEntity[];
  debtBaseline: number;
  dollarsFreedLifetime: number;
  updatedAt: string;
}

export interface SearchHit {
  node: MemoryNode;
  score: number;
  reason: string;
}

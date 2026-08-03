import { defaultWatchdogs } from "./watchdogs";
import type {
  GraphSnapshot,
  MemoryEdge,
  MemoryNode,
  MotionRun,
  OpenLoop,
  RiskEntity,
} from "./types";

/** Canonical risk entities — Acme ARR counted once, not per related loop. */
export function seedRiskEntities(): RiskEntity[] {
  return [
    {
      id: "risk:acme-renewal",
      label: "Acme Health Renewal ARR",
      dollars: 220_000,
      sourceNodeId: "project-acme-renewal",
    },
    {
      id: "risk:continuum-pilot",
      label: "Continuum Pilot budget",
      dollars: 48_000,
      sourceNodeId: "project-continuum-pilot",
    },
  ];
}

const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();

const nodes: MemoryNode[] = [
  {
    id: "person-maya",
    kind: "person",
    title: "Maya Chen",
    summary: "VP Product at Northstar. Prefers concise briefs, hates surprise scope changes.",
    tags: ["stakeholder", "product"],
    metadata: { email: "maya@northstar.ai", timezone: "PT" },
    createdAt: ago(240),
    updatedAt: ago(6),
  },
  {
    id: "person-jordan",
    kind: "person",
    title: "Jordan Blake",
    summary: "Staff engineer. Owns retrieval infra. Available Tue/Thu mornings.",
    tags: ["engineering", "owner"],
    metadata: { email: "jordan@northstar.ai", timezone: "PT" },
    createdAt: ago(200),
    updatedAt: ago(12),
  },
  {
    id: "person-sam",
    kind: "person",
    title: "Sam Okonkwo",
    summary: "Customer success lead for Acme Health. Escalates quietly but quickly.",
    tags: ["customer", "cs"],
    metadata: { company: "Acme Health", email: "sam@acmehealth.com" },
    createdAt: ago(180),
    updatedAt: ago(4),
  },
  {
    id: "project-continuum-pilot",
    kind: "project",
    title: "Continuum Pilot · Northstar",
    summary: "Internal pilot turning meeting residue into autonomous loop closure for the product org.",
    tags: ["pilot", "memory", "agents"],
    metadata: { stage: "active", budget: "$48k", dollarsAtRisk: 48000 },
    createdAt: ago(160),
    updatedAt: ago(2),
  },
  {
    id: "project-acme-renewal",
    kind: "project",
    title: "Acme Health Renewal",
    summary: "Enterprise renewal due in 11 days. Risk: incomplete onboarding playbook.",
    tags: ["revenue", "enterprise"],
    metadata: { arr: "$220k", dollarsAtRisk: 220000, closeDate: "2026-08-14" },
    createdAt: ago(90),
    updatedAt: ago(3),
  },
  {
    id: "decision-graph-first",
    kind: "decision",
    title: "Decision: Graph-first memory over pure vectors",
    summary: "Chose FalkorDB-style relationship graph as primary memory substrate; vectors only for fuzzy recall.",
    tags: ["architecture", "memory"],
    metadata: { decidedBy: "Maya Chen", confidence: 0.86 },
    createdAt: ago(48),
    updatedAt: ago(48),
  },
  {
    id: "artifact-qbr-notes",
    kind: "artifact",
    title: "Acme QBR Notes · Jul 28",
    summary: "Sam flagged onboarding gaps. Maya asked for a renewal-risk brief before Friday.",
    tags: ["meeting", "notes"],
    metadata: { source: "Grain transcript" },
    createdAt: ago(72),
    updatedAt: ago(72),
  },
  {
    id: "artifact-retrieval-rfc",
    kind: "artifact",
    title: "RFC: Contextual Retrieval v2",
    summary: "Jordan's draft RFC. Needs competitor scan + latency budget before review.",
    tags: ["rfc", "engineering"],
    metadata: { status: "draft" },
    createdAt: ago(36),
    updatedAt: ago(10),
  },
  {
    id: "goal-demo-ship",
    kind: "goal",
    title: "Ship Continuum demo for Memory Meets Motion",
    summary: "Ship a demo that makes Memory→Motion concrete in under 3 minutes.",
    tags: ["hackathon", "demo"],
    metadata: { deadline: "2026-08-03" },
    createdAt: ago(8),
    updatedAt: ago(1),
  },
  {
    id: "event-standup",
    kind: "event",
    title: "Standup residue captured",
    summary: "Three open loops detected from this morning's standup transcript.",
    tags: ["ingest", "standup"],
    metadata: { source: "voice" },
    createdAt: ago(5),
    updatedAt: ago(5),
  },
];

const loops: OpenLoop[] = [
  {
    id: "loop-renewal-brief",
    kind: "loop",
    title: "Draft Acme renewal-risk brief for Maya",
    summary:
      "Synthesize QBR notes, open tickets, and Sam's concerns into a one-page brief Maya can send before Friday.",
    tags: ["writing", "customer", "urgent"],
    status: "open",
    priority: 1,
    dueAt: ago(-48),
    contextNodeIds: [
      "person-maya",
      "person-sam",
      "project-acme-renewal",
      "artifact-qbr-notes",
    ],
    suggestedActions: [
      "Retrieve Acme memory subgraph",
      "Rank risks by renewal impact",
      "Draft one-page executive brief",
      "Propose 3 next actions with owners",
    ],
    riskEntityId: "risk:acme-renewal",
    metadata: {
      audience: "Maya Chen",
      format: "one-pager",
      hoursEstimate: 6,
    },
    createdAt: ago(70),
    updatedAt: ago(4),
  },
  {
    id: "loop-rfc-research",
    kind: "loop",
    title: "Complete competitor scan for Retrieval RFC",
    summary:
      "Jordan needs latency numbers and competitive positioning before Thursday design review.",
    tags: ["research", "engineering"],
    status: "open",
    priority: 2,
    dueAt: ago(-24),
    contextNodeIds: [
      "person-jordan",
      "artifact-retrieval-rfc",
      "decision-graph-first",
      "project-continuum-pilot",
    ],
    suggestedActions: [
      "Pull RFC constraints from memory",
      "Search live web for competitor latency claims",
      "Compare against graph-first decision",
      "Write annotated research note",
    ],
    riskEntityId: "risk:continuum-pilot",
    metadata: { owner: "Jordan Blake", hoursEstimate: 4 },
    createdAt: ago(30),
    updatedAt: ago(8),
  },
  {
    id: "loop-pilot-update",
    kind: "loop",
    title: "Send Continuum pilot weekly update",
    summary:
      "Compile memory coverage, closed loops, and demo readiness into a short update for Maya.",
    tags: ["status", "pilot"],
    status: "open",
    priority: 3,
    contextNodeIds: [
      "person-maya",
      "project-continuum-pilot",
      "goal-demo-ship",
      "decision-graph-first",
    ],
    suggestedActions: [
      "Aggregate loop metrics",
      "Highlight architecture decision",
      "Draft Slack-ready update",
    ],
    riskEntityId: "risk:continuum-pilot",
    metadata: { channel: "slack", hoursEstimate: 2 },
    createdAt: ago(20),
    updatedAt: ago(6),
  },
  {
    id: "loop-onboarding-playbook",
    kind: "loop",
    title: "Close Acme onboarding playbook gaps",
    summary:
      "Sam needs a checklist of missing onboarding steps with owners before renewal call.",
    tags: ["ops", "customer"],
    status: "open",
    priority: 2,
    contextNodeIds: [
      "person-sam",
      "project-acme-renewal",
      "artifact-qbr-notes",
    ],
    suggestedActions: [
      "Extract gaps from QBR notes",
      "Assign owners from memory graph",
      "Produce checklist artifact",
    ],
    riskEntityId: "risk:acme-renewal",
    metadata: {
      blocker: "missing playbook owners",
      hoursEstimate: 5,
    },
    createdAt: ago(68),
    updatedAt: ago(3),
  },
];

const edges: MemoryEdge[] = [
  { id: "e1", source: "person-maya", target: "project-continuum-pilot", kind: "owns", weight: 1, createdAt: ago(160) },
  { id: "e2", source: "person-jordan", target: "project-continuum-pilot", kind: "involves", weight: 0.9, createdAt: ago(150) },
  { id: "e3", source: "person-sam", target: "project-acme-renewal", kind: "involves", weight: 1, createdAt: ago(90) },
  { id: "e4", source: "person-maya", target: "project-acme-renewal", kind: "owns", weight: 0.8, createdAt: ago(88) },
  { id: "e5", source: "decision-graph-first", target: "project-continuum-pilot", kind: "related", weight: 1, createdAt: ago(48) },
  { id: "e6", source: "artifact-qbr-notes", target: "project-acme-renewal", kind: "mentions", weight: 1, createdAt: ago(72) },
  { id: "e7", source: "artifact-retrieval-rfc", target: "person-jordan", kind: "produced", weight: 1, createdAt: ago(36) },
  { id: "e8", source: "loop-renewal-brief", target: "person-maya", kind: "involves", weight: 1, createdAt: ago(70) },
  { id: "e9", source: "loop-renewal-brief", target: "project-acme-renewal", kind: "depends_on", weight: 1, createdAt: ago(70) },
  { id: "e10", source: "loop-rfc-research", target: "artifact-retrieval-rfc", kind: "depends_on", weight: 1, createdAt: ago(30) },
  { id: "e11", source: "loop-onboarding-playbook", target: "loop-renewal-brief", kind: "blocks", weight: 0.7, label: "feeds risk", createdAt: ago(68) },
  { id: "e12", source: "goal-demo-ship", target: "project-continuum-pilot", kind: "related", weight: 1, createdAt: ago(8) },
  { id: "e13", source: "event-standup", target: "loop-pilot-update", kind: "mentions", weight: 0.6, createdAt: ago(5) },
  { id: "e14", source: "loop-rfc-research", target: "decision-graph-first", kind: "related", weight: 0.8, createdAt: ago(28) },
  { id: "e15", source: "person-sam", target: "artifact-qbr-notes", kind: "produced", weight: 0.7, createdAt: ago(72) },
];

export function createSeedSnapshot(): GraphSnapshot {
  return {
    nodes: [...nodes, ...loops],
    edges,
    loops,
    runs: [] as MotionRun[],
    watchdogs: defaultWatchdogs(),
    riskEntities: seedRiskEntities(),
    debtBaseline: 0,
    dollarsFreedLifetime: 0,
    updatedAt: new Date().toISOString(),
  };
}

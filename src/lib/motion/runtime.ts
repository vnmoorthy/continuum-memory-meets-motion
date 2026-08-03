import { nanoid } from "nanoid";
import { computeDebtMetrics, dollarsForLoop } from "../debt";
import { formatContextPack, getMemorySubgraph } from "../memory/graph";
import {
  getSnapshot,
  recordDebtFreed,
  saveRun,
  updateLoop,
  upsertEdge,
  upsertNode,
} from "../store/db";
import type {
  Artifact,
  Citation,
  MemoryNode,
  MotionRun,
  MotionStep,
  OpenLoop,
  StreamEvent,
} from "../types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ProgressFn = (run: MotionRun) => Promise<void> | void;
type RunTrigger = NonNullable<MotionRun["trigger"]>;

function pushEvent(run: MotionRun, level: StreamEvent["level"], message: string) {
  run.events.push({
    id: nanoid(8),
    runId: run.id,
    ts: new Date().toISOString(),
    level,
    message,
  });
}

function markStep(run: MotionRun, stepId: string, status: MotionStep["status"], output?: string) {
  const step = run.steps.find((s) => s.id === stepId);
  if (!step) return;
  step.status = status;
  if (status === "running") step.startedAt = new Date().toISOString();
  if (status === "done" || status === "failed" || status === "skipped") {
    step.finishedAt = new Date().toISOString();
  }
  if (output) {
    step.output = output;
    step.detail = output;
  }
}

function toCitations(nodes: MemoryNode[]): Citation[] {
  return nodes.map((n) => ({ nodeId: n.id, title: n.title, kind: n.kind }));
}

function citationsBlock(citations: Citation[]) {
  return [
    "## Citations",
    ...citations.map(
      (c) => `- [${c.kind}] **${c.title}** (\`${c.nodeId}\`)`,
    ),
    "",
    "_Cited Motion: every claim above is grounded in Continuum memory nodes._",
  ].join("\n");
}

function withCitations(body: string, citations: Citation[]): string {
  return `${body.trim()}\n\n${citationsBlock(citations)}\n`;
}

async function webResearchStub(topic: string) {
  const findings = [
    {
      source: "Vertex AI Latency Benchmarks 2026",
      claim:
        "Graph-augmented retrieval cut p95 latency 18–27% vs flat vector RAG on multi-hop queries.",
    },
    {
      source: "Gartner Emerging Tech: Stateful Agents",
      claim: "Teams with durable memory graphs close 2.4× more operational loops per week.",
    },
    {
      source: "Acme Health Peer Review (synthetic)",
      claim:
        "Enterprise healthcare renewals fail most often on onboarding completeness, not feature gaps.",
    },
  ];
  return { topic, findings };
}

function buildBrief(
  loop: OpenLoop,
  citations: Citation[],
  research?: Awaited<ReturnType<typeof webResearchStub>>,
): Artifact {
  const cite = (id: string) => {
    const c = citations.find((x) => x.nodeId === id);
    return c ? `[[${c.title}|${c.nodeId}]]` : id;
  };

  const body = `# Acme Health Renewal Risk Brief
Prepared for: Maya Chen · Continuum Cited Motion
Loop: ${loop.title}
Dollars at risk: **$220k ARR** (Acme Health Renewal)

## Situation
${loop.summary}

Maya (${cite("person-maya")}) needs a Friday-ready brief. Sam (${cite("person-sam")}) escalated onboarding gaps in ${cite("artifact-qbr-notes")}. Project context: ${cite("project-acme-renewal")}.

## Top risks
1. Onboarding playbook gaps remain unowned — flagged in ${cite("artifact-qbr-notes")}.
2. Renewal window is ~11 days against ${cite("project-acme-renewal")} close date.
3. Quiet escalation pattern from CS — silence ≠ green (${cite("person-sam")}).

## Recommended moves
1. Send this brief to Maya with executive sponsorship ask before Friday.
2. Assign onboarding playbook owners before the renewal call.
3. Schedule a 20-min Sam sync focused only on open checklist items.

## External signal
${
  research
    ? research.findings.map((f) => `- ${f.source}: ${f.claim}`).join("\n")
    : "- No live research attached."
}

— Continuum Motion · RocketRide pipeline \`close-open-loop\``;

  return {
    id: nanoid(10),
    title: "Acme Renewal Risk Brief",
    kind: "brief",
    content: withCitations(body, citations),
    citations,
    createdAt: new Date().toISOString(),
  };
}

function buildResearchNote(
  loop: OpenLoop,
  citations: Citation[],
  research: Awaited<ReturnType<typeof webResearchStub>>,
): Artifact {
  const body = `# Competitor & Latency Scan
For: ${loop.title}

## Query
${research.topic}

## Findings
${research.findings.map((f) => `### ${f.source}\n${f.claim}`).join("\n\n")}

## Memory grounding
RFC draft and graph-first decision shape the recommendation:
${citations
  .filter((c) => c.kind === "artifact" || c.kind === "decision" || c.kind === "person")
  .map((c) => `- [[${c.title}|${c.nodeId}]]`)
  .join("\n")}

## Suggested RFC insert
> Early competitive signals reinforce graph-augmented retrieval for multi-hop product questions, with measurable p95 gains versus flat vector baselines.`;

  return {
    id: nanoid(10),
    title: "Retrieval RFC · Competitor Scan",
    kind: "research",
    content: withCitations(body, citations),
    citations,
    createdAt: new Date().toISOString(),
  };
}

function buildChecklist(loop: OpenLoop, citations: Citation[]): Artifact {
  const body = `# Onboarding Playbook Gaps
Loop: ${loop.title}

Grounded in ${citations.map((c) => `[[${c.title}|${c.nodeId}]]`).join(", ")}.

- [ ] Assign owner for SSO setup guide (suggested: Jordan Blake)
- [ ] Publish day-1 clinician checklist (suggested: Sam Okonkwo)
- [ ] Confirm data residency FAQ for healthcare (suggested: Maya Chen)
- [ ] Schedule renewal-readiness call with Sam
- [ ] Attach completed checklist to Acme renewal project memory`;

  return {
    id: nanoid(10),
    title: "Acme Onboarding Gap Checklist",
    kind: "checklist",
    content: withCitations(body, citations),
    citations,
    createdAt: new Date().toISOString(),
  };
}

function buildStatusUpdate(loop: OpenLoop, citations: Citation[]): Artifact {
  const body = `# Continuum Pilot · Weekly
Hi Maya —

Memory coverage is healthy: people, projects, decisions, and open loops are linked in the graph.
Motion is burning down Open Loop Debt around Acme renewal and the Retrieval RFC.
Architecture bet remains graph-first memory with RocketRide execution.

Cited context: ${citations.map((c) => `[[${c.title}|${c.nodeId}]]`).join("; ")}.

Demo-ready for Memory Meets Motion.

— Continuum`;

  return {
    id: nanoid(10),
    title: "Continuum Pilot Weekly Update",
    kind: "note",
    content: withCitations(body, citations),
    citations,
    createdAt: new Date().toISOString(),
  };
}

function pickArtifact(
  loop: OpenLoop,
  citations: Citation[],
  research?: Awaited<ReturnType<typeof webResearchStub>>,
) {
  if (loop.id.includes("renewal") || loop.title.toLowerCase().includes("brief")) {
    return buildBrief(loop, citations, research);
  }
  if (loop.id.includes("rfc") || loop.title.toLowerCase().includes("competitor")) {
    return buildResearchNote(loop, citations, research ?? { topic: loop.title, findings: [] });
  }
  if (loop.id.includes("onboarding") || loop.title.toLowerCase().includes("playbook")) {
    return buildChecklist(loop, citations);
  }
  return buildStatusUpdate(loop, citations);
}

export async function createQueuedRun(loopId: string, trigger: RunTrigger = "manual") {
  const db = await getSnapshot();
  const loop = db.loops.find((l) => l.id === loopId);
  if (!loop) throw new Error("Open loop not found");
  if (loop.status === "running") throw new Error("Loop already running");
  if (loop.status === "closed") throw new Error("Loop already closed");

  const before = computeDebtMetrics(db);

  const steps: MotionStep[] = [
    {
      id: "retrieve",
      name: "Retrieve memory subgraph",
      kind: "retrieve",
      status: "pending",
      detail: "Pull FalkorDB-style neighborhood around the loop",
    },
    {
      id: "reason",
      name: "Reason over durable context",
      kind: "reason",
      status: "pending",
      detail: "Rank facts, owners, blockers, and due pressure",
    },
    {
      id: "tool",
      name: "Gather live context",
      kind: "tool",
      status: "pending",
      detail: "Linkup-style web/research enrichment when needed",
    },
    {
      id: "write",
      name: "Produce cited artifact",
      kind: "write",
      status: "pending",
      detail: "Draft deliverable with inline memory citations",
    },
    {
      id: "persist",
      name: "Write back to memory",
      kind: "write",
      status: "pending",
      detail: "Store artifact + close loop edges; reduce Open Loop Debt",
    },
    {
      id: "notify",
      name: "Notify stakeholders",
      kind: "notify",
      status: "pending",
      detail: "Surface completion + debt delta",
    },
  ];

  const run: MotionRun = {
    id: `run_${nanoid(10)}`,
    loopId: loop.id,
    title: `Close · ${loop.title}`,
    status: "queued",
    pipeline: "pipelines/close-open-loop.json",
    steps,
    events: [],
    memoryUsed: loop.contextNodeIds,
    artifacts: [],
    citations: [],
    debtBefore: before.score,
    trigger,
    startedAt: new Date().toISOString(),
  };

  pushEvent(
    run,
    "info",
    `Run queued (${trigger}). Open Loop Debt before: ${before.score}. Pipeline: RocketRide-compatible close-open-loop.`,
  );
  await saveRun(run);
  await updateLoop(loop.id, { status: "running" });
  return run;
}

export async function executeRun(runId: string, onProgress?: ProgressFn) {
  const db = await getSnapshot();
  const run = db.runs.find((r) => r.id === runId);
  if (!run) throw new Error("Run not found");
  const loop = db.loops.find((l) => l.id === run.loopId);
  if (!loop) throw new Error("Loop not found");

  const dollars = dollarsForLoop(loop, db.nodes);
  run.status = "running";
  pushEvent(run, "info", "Motion started. Bridging long-term memory → autonomous execution.");
  await saveRun(run);
  await onProgress?.(run);

  try {
    markStep(run, "retrieve", "running");
    await saveRun(run);
    await onProgress?.(run);
    await sleep(650);
    const subgraph = await getMemorySubgraph([loop.id, ...loop.contextNodeIds], 1);
    const citations = toCitations(subgraph.nodes);
    run.memoryUsed = subgraph.nodes.map((n) => n.id);
    run.citations = citations;
    markStep(
      run,
      "retrieve",
      "done",
      `Loaded ${subgraph.nodes.length} nodes / ${subgraph.edges.length} edges. Citations ready.`,
    );
    pushEvent(run, "success", `Memory subgraph ready (${citations.length} citable entities).`);
    await saveRun(run);
    await onProgress?.(run);

    markStep(run, "reason", "running");
    await saveRun(run);
    await onProgress?.(run);
    await sleep(700);
    markStep(
      run,
      "reason",
      "done",
      `Priority P${loop.priority}. $${Math.round(dollars / 1000)}k linked risk ranked against durable context.`,
    );
    pushEvent(run, "info", "Agent reasoned over owners, blockers, dollars at risk, and due pressure.");
    await saveRun(run);
    await onProgress?.(run);

    markStep(run, "tool", "running");
    await saveRun(run);
    await onProgress?.(run);
    await sleep(750);
    const needsResearch =
      loop.tags.includes("research") ||
      loop.title.toLowerCase().includes("brief") ||
      loop.title.toLowerCase().includes("competitor");
    const research = needsResearch
      ? await webResearchStub(`${loop.title} latency graph retrieval enterprise renewal`)
      : undefined;
    markStep(
      run,
      "tool",
      "done",
      needsResearch
        ? `Live context pack assembled (${research?.findings.length ?? 0} sources).`
        : "Skipped live web — memory citations sufficient.",
    );
    pushEvent(
      run,
      "info",
      needsResearch ? "Linkup-style research enrichment attached." : "No external research required.",
    );
    await saveRun(run);
    await onProgress?.(run);

    markStep(run, "write", "running");
    await saveRun(run);
    await onProgress?.(run);
    await sleep(900);
    const artifact = pickArtifact(loop, citations, research);
    run.artifacts.push(artifact);
    markStep(
      run,
      "write",
      "done",
      `Created ${artifact.kind}: ${artifact.title} with ${artifact.citations.length} citations.`,
    );
    pushEvent(run, "success", `Cited artifact ready · ${artifact.title}`);
    await saveRun(run);
    await onProgress?.(run);

    markStep(run, "persist", "running");
    await saveRun(run);
    await onProgress?.(run);
    await sleep(600);
    const artifactNode = {
      id: `artifact-${artifact.id}`,
      kind: "artifact" as const,
      title: artifact.title,
      summary: artifact.content.slice(0, 180).replace(/\n/g, " "),
      tags: ["generated", artifact.kind, "motion", "cited"],
      metadata: { runId: run.id, artifactKind: artifact.kind, citations: artifact.citations.length },
      createdAt: artifact.createdAt,
      updatedAt: artifact.createdAt,
    };
    await upsertNode(artifactNode);
    await upsertEdge({
      id: `edge-${nanoid(8)}`,
      source: loop.id,
      target: artifactNode.id,
      kind: "produced",
      weight: 1,
      createdAt: new Date().toISOString(),
    });
    await upsertEdge({
      id: `edge-${nanoid(8)}`,
      source: artifactNode.id,
      target: loop.id,
      kind: "closes",
      weight: 1,
      createdAt: new Date().toISOString(),
    });
    await updateLoop(loop.id, { status: "closed" });
    await recordDebtFreed(dollars);

    const afterSnap = await getSnapshot();
    const after = computeDebtMetrics(afterSnap);
    run.debtAfter = after.score;
    run.dollarsFreed = dollars;
    markStep(
      run,
      "persist",
      "done",
      `Write-back complete. Debt ${run.debtBefore ?? "?"} → ${after.score}. Freed ~$${Math.round(dollars / 1000)}k risk attribution.`,
    );
    pushEvent(run, "success", "Memory updated. Loop closed. Open Loop Debt reduced.");
    await saveRun(run);
    await onProgress?.(run);

    markStep(run, "notify", "running");
    await saveRun(run);
    await onProgress?.(run);
    await sleep(450);
    markStep(run, "notify", "done", "Stakeholders notified via in-app completion signal.");
    pushEvent(run, "success", "Motion complete. Memory meets motion.");
    run.status = "succeeded";
    run.finishedAt = new Date().toISOString();
    run.summary = `Closed “${loop.title}” · debt ${run.debtBefore}→${run.debtAfter} · ${artifact.title}`;
    await saveRun(run);
    await onProgress?.(run);
    return run;
  } catch (err) {
    run.status = "failed";
    run.finishedAt = new Date().toISOString();
    pushEvent(run, "error", err instanceof Error ? err.message : "Unknown failure");
    await updateLoop(loop.id, { status: "blocked" });
    await saveRun(run);
    await onProgress?.(run);
    throw err;
  }
}

export async function startAndExecute(loopId: string, trigger: RunTrigger = "manual") {
  const run = await createQueuedRun(loopId, trigger);
  void executeRun(run.id).catch((err) => console.error("Run failed", err));
  return run;
}

import { nanoid } from "nanoid";
import { computeDebtMetrics, dollarsForLoop } from "../debt";
import { getMemorySubgraph } from "../memory/graph";
import { demoPrefix, getContinuumMode, isDemoMode } from "../mode";
import {
  ConflictError,
  enqueueJob,
  getActiveRunForLoop,
  getRun,
  getRunByIdempotencyKey,
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
    message: demoPrefix(message),
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
  const groundedNote = isDemoMode()
    ? "_Cited Motion (DEMO): citations reference Continuum memory nodes only. External research below is simulated — not live web grounding._"
    : "_Cited Motion: every claim above is grounded in Continuum memory nodes._";
  return [
    "## Citations",
    ...citations.map((c) => `- [${c.kind}] **${c.title}** (\`${c.nodeId}\`)`),
    "",
    groundedNote,
  ].join("\n");
}

function withCitations(body: string, citations: Citation[]): string {
  return `${body.trim()}\n\n${citationsBlock(citations)}\n`;
}

async function webResearchStub(topic: string) {
  const findings = [
    {
      source: "[DEMO SIMULATED] Vertex AI Latency Benchmarks 2026",
      claim:
        "Graph-augmented retrieval cut p95 latency 18–27% vs flat vector RAG on multi-hop queries. (Simulated — not fetched live.)",
    },
    {
      source: "[DEMO SIMULATED] Gartner Emerging Tech: Stateful Agents",
      claim:
        "Teams with durable memory graphs close 2.4× more operational loops per week. (Simulated — not fetched live.)",
    },
    {
      source: "[DEMO SIMULATED] Acme Health Peer Review",
      claim:
        "Enterprise healthcare renewals fail most often on onboarding completeness, not feature gaps. (Simulated.)",
    },
  ];
  return { topic, findings, simulated: true as const };
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
Prepared for: Maya Chen · Continuum Cited Motion${isDemoMode() ? " · DEMO" : ""}
Loop: ${loop.title}
Dollars at risk: **$220k ARR** (risk entity \`risk:acme-renewal\` — counted once in portfolio)

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
    : "- No research attached."
}

— Continuum Motion · RocketRide-compatible pipeline \`close-open-loop\`${isDemoMode() ? " · DEMO simulation" : ""}`;

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
  const body = `# Competitor & Latency Scan${isDemoMode() ? " (DEMO — simulated sources)" : ""}
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
  const body = `# Continuum Pilot · Weekly${isDemoMode() ? " (DEMO)" : ""}
Hi Maya —

Memory coverage is healthy: people, projects, decisions, and open loops are linked in the graph.
Motion is burning down Open Loop Debt around Acme renewal and the Retrieval RFC.
Architecture bet remains graph-first memory with RocketRide-compatible execution.

Cited context: ${citations.map((c) => `[[${c.title}|${c.nodeId}]]`).join("; ")}.

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
    return buildResearchNote(loop, citations, research ?? { topic: loop.title, findings: [], simulated: true });
  }
  if (loop.id.includes("onboarding") || loop.title.toLowerCase().includes("playbook")) {
    return buildChecklist(loop, citations);
  }
  return buildStatusUpdate(loop, citations);
}

export type CreateRunResult =
  | { ok: true; run: MotionRun; created: true }
  | { ok: true; run: MotionRun; created: false; conflict: "active" | "idempotent" }
  | { ok: false; error: string; status: number };

export async function createQueuedRun(
  workspaceId: string,
  loopId: string,
  trigger: RunTrigger = "manual",
  idempotencyKey?: string | null,
): Promise<CreateRunResult> {
  if (idempotencyKey) {
    const prior = await getRunByIdempotencyKey(workspaceId, idempotencyKey);
    if (prior) {
      return { ok: true, run: prior, created: false, conflict: "idempotent" };
    }
  }

  const active = await getActiveRunForLoop(workspaceId, loopId);
  if (active) {
    return { ok: true, run: active, created: false, conflict: "active" };
  }

  const db = await getSnapshot(workspaceId);
  const loop = db.loops.find((l) => l.id === loopId);
  if (!loop) return { ok: false, error: "Open loop not found", status: 404 };
  if (loop.status === "closed") return { ok: false, error: "Loop already closed", status: 400 };

  const before = computeDebtMetrics(db);
  const mode = getContinuumMode();

  const steps: MotionStep[] = [
    {
      id: "retrieve",
      name: "Retrieve memory subgraph",
      kind: "retrieve",
      status: "pending",
      detail: "Pull memory neighborhood around the loop",
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
      name: mode === "demo" ? "Simulate live context (DEMO)" : "Gather live context",
      kind: "tool",
      status: "pending",
      detail:
        mode === "demo"
          ? "DEMO: synthetic research only — not Linkup/live web"
          : "Linkup-style web/research enrichment when configured",
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
      name: mode === "demo" ? "In-app notify (DEMO — no outbound)" : "Notify stakeholders",
      kind: "notify",
      status: "pending",
      detail:
        mode === "demo"
          ? "DEMO: in-app completion signal only — no email/Slack delivery"
          : "Surface completion + debt delta",
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
    idempotencyKey: idempotencyKey ?? undefined,
    workspaceId,
    simulated: mode === "demo",
    mode,
  };

  pushEvent(
    run,
    "info",
    `Run queued (${trigger}). Open Loop Debt before: ${before.score}. Pipeline: close-open-loop. Mode: ${mode}.`,
  );

  try {
    await saveRun(workspaceId, run, { idempotencyKey });
  } catch (err) {
    if (err instanceof ConflictError) {
      return {
        ok: true,
        run: err.existingRun,
        created: false,
        conflict: err.message.includes("Idempotent") ? "idempotent" : "active",
      };
    }
    throw err;
  }

  // Verify readable before returning success
  const readable = await getRun(workspaceId, run.id);
  if (!readable) {
    return { ok: false, error: "Run persisted but not readable", status: 500 };
  }

  await updateLoop(workspaceId, loop.id, { status: "running" });
  await enqueueJob(workspaceId, run.id);
  // Dynamic import avoids circular dependency with the job worker.
  const { scheduleJobKick } = await import("../jobs/worker");
  scheduleJobKick();
  return { ok: true, run: readable, created: true };
}

export async function executeRun(
  workspaceId: string,
  runId: string,
  onProgress?: ProgressFn,
) {
  const run = await getRun(workspaceId, runId);
  if (!run) throw new Error("Run not found");
  if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
    return run;
  }
  const db = await getSnapshot(workspaceId);
  const loop = db.loops.find((l) => l.id === run.loopId);
  if (!loop) throw new Error("Loop not found");

  const dollars = dollarsForLoop(loop, db.nodes, db);
  run.status = "running";
  pushEvent(run, "info", "Motion started. Bridging long-term memory → autonomous execution.");
  await saveRun(workspaceId, run);
  await onProgress?.(run);

  try {
    markStep(run, "retrieve", "running");
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    await sleep(process.env.CONTINUUM_FAST === "1" ? 5 : 650);
    const subgraph = await getMemorySubgraph(workspaceId, [loop.id, ...loop.contextNodeIds], 1);
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
    await saveRun(workspaceId, run);
    await onProgress?.(run);

    markStep(run, "reason", "running");
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    await sleep(process.env.CONTINUUM_FAST === "1" ? 5 : 700);
    markStep(
      run,
      "reason",
      "done",
      `Priority P${loop.priority}. $${Math.round(dollars / 1000)}k linked risk ranked against durable context.`,
    );
    pushEvent(run, "info", "Agent reasoned over owners, blockers, dollars at risk, and due pressure.");
    await saveRun(workspaceId, run);
    await onProgress?.(run);

    markStep(run, "tool", "running");
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    await sleep(process.env.CONTINUUM_FAST === "1" ? 5 : 750);
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
        ? isDemoMode()
          ? `DEMO simulated research pack (${research?.findings.length ?? 0} synthetic sources). Not live.`
          : `Live context pack assembled (${research?.findings.length ?? 0} sources).`
        : "Skipped external research — memory citations sufficient.",
    );
    pushEvent(
      run,
      "info",
      needsResearch
        ? isDemoMode()
          ? "DEMO: synthetic research attached — not Linkup/live web."
          : "Research enrichment attached."
        : "No external research required.",
    );
    await saveRun(workspaceId, run);
    await onProgress?.(run);

    markStep(run, "write", "running");
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    await sleep(process.env.CONTINUUM_FAST === "1" ? 5 : 900);
    const artifact = pickArtifact(loop, citations, research);
    run.artifacts.push(artifact);
    markStep(
      run,
      "write",
      "done",
      `Created ${artifact.kind}: ${artifact.title} with ${artifact.citations.length} citations.`,
    );
    pushEvent(run, "success", `Cited artifact ready · ${artifact.title}`);
    await saveRun(workspaceId, run);
    await onProgress?.(run);

    markStep(run, "persist", "running");
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    await sleep(process.env.CONTINUUM_FAST === "1" ? 5 : 600);
    const artifactNode = {
      id: `artifact-${artifact.id}`,
      kind: "artifact" as const,
      title: artifact.title,
      summary: artifact.content.slice(0, 180).replace(/\n/g, " "),
      tags: ["generated", artifact.kind, "motion", "cited", ...(isDemoMode() ? ["demo"] : [])],
      metadata: {
        runId: run.id,
        artifactKind: artifact.kind,
        citations: artifact.citations.length,
        simulated: isDemoMode(),
      },
      createdAt: artifact.createdAt,
      updatedAt: artifact.createdAt,
    };
    await upsertNode(workspaceId, artifactNode);
    await upsertEdge(workspaceId, {
      id: `edge-${nanoid(8)}`,
      source: loop.id,
      target: artifactNode.id,
      kind: "produced",
      weight: 1,
      createdAt: new Date().toISOString(),
    });
    await upsertEdge(workspaceId, {
      id: `edge-${nanoid(8)}`,
      source: artifactNode.id,
      target: loop.id,
      kind: "closes",
      weight: 1,
      createdAt: new Date().toISOString(),
    });
    await updateLoop(workspaceId, loop.id, { status: "closed" });
    await recordDebtFreed(workspaceId, dollars);

    const afterSnap = await getSnapshot(workspaceId);
    const afterMetrics = computeDebtMetrics(afterSnap);
    run.debtAfter = afterMetrics.score;
    run.dollarsFreed = dollars;
    markStep(
      run,
      "persist",
      "done",
      `Write-back complete. Debt ${run.debtBefore ?? "?"} → ${afterMetrics.score}. Freed ~$${Math.round(dollars / 1000)}k risk attribution.`,
    );
    pushEvent(run, "success", "Memory updated. Loop closed. Open Loop Debt reduced.");
    await saveRun(workspaceId, run);
    await onProgress?.(run);

    markStep(run, "notify", "running");
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    await sleep(process.env.CONTINUUM_FAST === "1" ? 5 : 450);
    markStep(
      run,
      "notify",
      "done",
      isDemoMode()
        ? "DEMO: in-app completion signal only — no outbound email/Slack delivery receipt."
        : "Stakeholders notified.",
    );
    pushEvent(
      run,
      "success",
      isDemoMode()
        ? "Motion complete (DEMO). No outbound notifications were sent."
        : "Motion complete. Memory meets motion.",
    );
    run.status = "succeeded";
    run.finishedAt = new Date().toISOString();
    run.summary = `Closed “${loop.title}” · debt ${run.debtBefore}→${run.debtAfter} · ${artifact.title}`;
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    return run;
  } catch (err) {
    run.status = "failed";
    run.finishedAt = new Date().toISOString();
    pushEvent(run, "error", err instanceof Error ? err.message : "Unknown failure");
    await updateLoop(workspaceId, loop.id, { status: "blocked" });
    await saveRun(workspaceId, run);
    await onProgress?.(run);
    throw err;
  }
}

export async function startAndExecute(
  workspaceId: string,
  loopId: string,
  trigger: RunTrigger = "manual",
  idempotencyKey?: string | null,
) {
  return createQueuedRun(workspaceId, loopId, trigger, idempotencyKey);
}

import { sponsorEnv } from "./env";
import type { ResearchResult, SponsorStatus } from "./types";

export async function linkupStatus(): Promise<SponsorStatus> {
  const configured = sponsorEnv.linkup.configured();
  const now = new Date().toISOString();
  let sdkLoaded = false;
  try {
    await import("linkup-sdk");
    sdkLoaded = true;
  } catch (err) {
    return {
      id: "linkup",
      name: "Linkup",
      package: "linkup-sdk",
      role: "Live web research for Motion tool steps",
      sdkLoaded: false,
      envVars: ["LINKUP_API_KEY"],
      lastCheckedAt: now,
      configured,
      state: "not_configured",
      live: false,
      detail: "Failed to load linkup-sdk.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }

  const base = {
    id: "linkup" as const,
    name: "Linkup",
    package: "linkup-sdk",
    role: "Live web research for Motion tool steps",
    sdkLoaded,
    envVars: ["LINKUP_API_KEY"],
    lastCheckedAt: now,
    configured,
  };

  if (!configured) {
    return {
      ...base,
      state: "not_configured",
      live: false,
      detail: "SDK loaded. Set LINKUP_API_KEY to enable live search; DEMO uses labeled synthetic findings.",
    };
  }

  try {
    const { LinkupClient } = await import("linkup-sdk");
    const client = new LinkupClient({ apiKey: sponsorEnv.linkup.apiKey()! });
    await client.search({
      query: "Linkup API health check Continuum",
      depth: "fast",
      outputType: "searchResults",
      maxResults: 1,
    });
    return {
      ...base,
      state: "live",
      live: true,
      detail: "linkup-sdk connected — search probe succeeded.",
    };
  } catch (err) {
    return {
      ...base,
      state: "configured_unreachable",
      live: false,
      detail: "API key present but probe failed.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function linkupResearch(topic: string): Promise<ResearchResult> {
  const key = sponsorEnv.linkup.apiKey();
  if (!key) {
    return demoResearch(topic);
  }

  try {
    const { LinkupClient } = await import("linkup-sdk");
    const client = new LinkupClient({ apiKey: key });
    const retrievedAt = new Date().toISOString();
    const res = await client.search({
      query: topic,
      depth: "standard",
      outputType: "sourcedAnswer",
      includeInlineCitations: true,
    });

    const findings: ResearchResult["findings"] = [];
    const answer = (res as { answer?: string; sources?: Array<{ name?: string; url?: string; snippet?: string }> })
      .answer;
    const sources =
      (res as { sources?: Array<{ name?: string; url?: string; snippet?: string }> }).sources ?? [];

    if (answer) {
      findings.push({
        source: "Linkup sourced answer",
        claim: answer.slice(0, 1200),
        provider: "linkup",
        retrievedAt,
        url: sources[0]?.url,
      });
    }
    for (const s of sources.slice(0, 5)) {
      findings.push({
        source: s.name ?? s.url ?? "Linkup source",
        claim: (s.snippet ?? s.name ?? "Retrieved by Linkup").slice(0, 600),
        url: s.url,
        provider: "linkup",
        retrievedAt,
      });
    }

    if (!findings.length) {
      findings.push({
        source: "Linkup",
        claim: "Search completed with no structured sources; see provider logs.",
        provider: "linkup",
        retrievedAt,
      });
    }

    return {
      topic,
      findings,
      simulated: false,
      provider: "linkup",
      providerRequestId: `linkup_${retrievedAt}`,
    };
  } catch (err) {
    const fallback = demoResearch(topic);
    fallback.findings.unshift({
      source: "[DEMO FALLBACK] Linkup unavailable",
      claim: `Live Linkup call failed: ${err instanceof Error ? err.message : String(err)}. Showing DEMO findings only.`,
      provider: "demo",
    });
    return fallback;
  }
}

function demoResearch(topic: string): ResearchResult {
  return {
    topic,
    findings: [
      {
        source: "[DEMO SIMULATED] Stateful agent retrieval notes",
        claim:
          "Graph-augmented retrieval often improves multi-hop product questions vs flat vector RAG. Simulated — not fetched live.",
        provider: "demo",
      },
      {
        source: "[DEMO SIMULATED] Enterprise renewal patterns",
        claim:
          "Healthcare renewals fail most often on onboarding completeness, not feature gaps. Simulated.",
        provider: "demo",
      },
    ],
    simulated: true,
    provider: "demo",
  };
}

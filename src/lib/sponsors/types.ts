export type SponsorId =
  | "rocketride"
  | "falkordb"
  | "linkup"
  | "laserdata"
  | "guild"
  | "snyk";

export type SponsorState = "live" | "configured_unreachable" | "demo_fallback" | "not_configured";

export interface SponsorStatus {
  id: SponsorId;
  name: string;
  package: string;
  role: string;
  state: SponsorState;
  configured: boolean;
  live: boolean;
  sdkLoaded: boolean;
  detail: string;
  envVars: string[];
  lastError?: string;
  lastCheckedAt: string;
}

export interface ResearchFinding {
  source: string;
  claim: string;
  url?: string;
  retrievedAt?: string;
  provider: "linkup" | "demo";
}

export interface ResearchResult {
  topic: string;
  findings: ResearchFinding[];
  simulated: boolean;
  provider: "linkup" | "demo";
  providerRequestId?: string;
}

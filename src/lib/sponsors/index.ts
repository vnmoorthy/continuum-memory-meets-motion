import { falkorStatus } from "./falkordb";
import { guildStatus } from "./guild";
import { laserStatus } from "./laserdata";
import { linkupStatus } from "./linkup";
import { rocketrideStatus } from "./rocketride";
import { snykStatus } from "./snyk";
import type { SponsorStatus } from "./types";

export * from "./types";
export { linkupResearch } from "./linkup";
export { mirrorEdgeToFalkor, mirrorNodeToFalkor } from "./falkordb";
export { rocketrideExecutePipeline } from "./rocketride";
export { publishLaserEvent } from "./laserdata";
export { recordGuildExperiment } from "./guild";
export { runSnykScan } from "./snyk";

export async function getAllSponsorStatuses(): Promise<SponsorStatus[]> {
  const results = await Promise.all([
    rocketrideStatus(),
    falkorStatus(),
    linkupStatus(),
    laserStatus(),
    guildStatus(),
    snykStatus(),
  ]);
  return results;
}

export function sponsorSummary(statuses: SponsorStatus[]) {
  const live = statuses.filter((s) => s.live).map((s) => s.id);
  const configured = statuses.filter((s) => s.configured).map((s) => s.id);
  const sdkLoaded = statuses.filter((s) => s.sdkLoaded).map((s) => s.id);
  return {
    liveCount: live.length,
    configuredCount: configured.length,
    sdkLoadedCount: sdkLoaded.length,
    live,
    configured,
    sdkLoaded,
    allSdksPresent: sdkLoaded.length === statuses.length,
  };
}

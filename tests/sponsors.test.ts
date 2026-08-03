import { describe, expect, it } from "vitest";
import { getAllSponsorStatuses, linkupResearch, sponsorSummary } from "../src/lib/sponsors";

describe("sponsor SDK adapters", () => {
  it("loads all six sponsor client packages and reports status", async () => {
    const statuses = await getAllSponsorStatuses();
    expect(statuses).toHaveLength(6);
    const ids = statuses.map((s) => s.id).sort();
    expect(ids).toEqual([
      "falkordb",
      "guild",
      "laserdata",
      "linkup",
      "rocketride",
      "snyk",
    ]);
    for (const s of statuses) {
      expect(s.sdkLoaded).toBe(true);
      expect(s.package.length).toBeGreaterThan(0);
      expect(s.detail.length).toBeGreaterThan(0);
    }
    const summary = sponsorSummary(statuses);
    expect(summary.sdkLoadedCount).toBe(6);
    expect(summary.allSdksPresent).toBe(true);
  });

  it("linkupResearch returns DEMO findings when no API key", async () => {
    delete process.env.LINKUP_API_KEY;
    delete process.env.LINKUP_APIKEY;
    const research = await linkupResearch("graph retrieval latency");
    expect(research.simulated).toBe(true);
    expect(research.provider).toBe("demo");
    expect(research.findings.length).toBeGreaterThan(0);
    expect(research.findings[0]?.source).toMatch(/DEMO/i);
  });
});

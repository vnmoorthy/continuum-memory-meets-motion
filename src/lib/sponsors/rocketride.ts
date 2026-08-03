import { readFile } from "fs/promises";
import path from "path";
import { sponsorEnv } from "./env";
import type { SponsorStatus } from "./types";

export async function rocketrideStatus(): Promise<SponsorStatus> {
  const configured = sponsorEnv.rocketride.configured();
  const now = new Date().toISOString();
  let sdkLoaded = false;
  try {
    await import("rocketride");
    sdkLoaded = true;
  } catch (err) {
    return {
      id: "rocketride",
      name: "RocketRide",
      package: "rocketride",
      role: "AI pipeline runtime for close-open-loop Motion",
      sdkLoaded: false,
      envVars: ["ROCKETRIDE_APIKEY", "ROCKETRIDE_URI"],
      lastCheckedAt: now,
      configured,
      state: "not_configured",
      live: false,
      detail: "Failed to load rocketride package.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }

  const base = {
    id: "rocketride" as const,
    name: "RocketRide",
    package: "rocketride",
    role: "AI pipeline runtime for close-open-loop Motion",
    sdkLoaded,
    envVars: ["ROCKETRIDE_APIKEY", "ROCKETRIDE_URI"],
    lastCheckedAt: now,
    configured,
  };

  if (!configured) {
    return {
      ...base,
      state: "not_configured",
      live: false,
      detail:
        "SDK loaded. Local durable worker executes the pipeline JSON. Set ROCKETRIDE_APIKEY to run on RocketRide Cloud.",
    };
  }

  const { RocketRideClient } = await import("rocketride");
  const client = new RocketRideClient({
    auth: sponsorEnv.rocketride.auth(),
    uri: sponsorEnv.rocketride.uri(),
    requestTimeout: 8_000,
    maxRetryTime: 8_000,
  });

  try {
    await client.connect();
    await client.disconnect();
    return {
      ...base,
      state: "live",
      live: true,
      detail: `Connected to ${sponsorEnv.rocketride.uri()}.`,
    };
  } catch (err) {
    try {
      await client.disconnect();
    } catch {
      /* ignore */
    }
    return {
      ...base,
      state: "configured_unreachable",
      live: false,
      detail: "API key present but connect failed.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function rocketrideExecutePipeline(input: {
  loopId: string;
  loopTitle: string;
  contextPack: string;
}): Promise<{ token: string; uri: string; note: string } | null> {
  if (!sponsorEnv.rocketride.configured()) return null;

  const pipelinePath = path.join(process.cwd(), "pipelines", "close-open-loop.json");
  const raw = await readFile(pipelinePath, "utf8");
  const pipeline = JSON.parse(raw);
  const { RocketRideClient } = await import("rocketride");

  const client = new RocketRideClient({
    auth: sponsorEnv.rocketride.auth(),
    uri: sponsorEnv.rocketride.uri(),
    requestTimeout: 60_000,
  });

  await client.connect();
  try {
    const { token } = await client.use({
      pipeline,
      source: "continuum",
    });
    await client.send(
      token,
      JSON.stringify(input),
      { name: "continuum-loop.json" },
      "application/json",
    );
    return {
      token,
      uri: sponsorEnv.rocketride.uri()!,
      note: "Pipeline submitted via rocketride SDK (close-open-loop).",
    };
  } finally {
    try {
      await client.disconnect();
    } catch {
      /* ignore */
    }
  }
}

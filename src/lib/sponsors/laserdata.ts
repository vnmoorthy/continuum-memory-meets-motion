import { promises as fs } from "fs";
import path from "path";
import { sponsorEnv } from "./env";
import type { SponsorStatus } from "./types";

type LaserClient = {
  capabilities: () => Promise<unknown>;
  stream: (name: string) => {
    topic: (name: string) => {
      ensure: (n?: number) => Promise<void>;
      publish: () => { json: (v: unknown) => { send: () => Promise<void> } };
    };
  };
};

let cached: LaserClient | null = null;
const LOCAL_FALLBACK = path.join(process.cwd(), "data", "laser-events.jsonl");

async function appendLocal(event: Record<string, unknown>) {
  await fs.mkdir(path.dirname(LOCAL_FALLBACK), { recursive: true });
  await fs.appendFile(LOCAL_FALLBACK, `${JSON.stringify(event)}\n`, "utf8");
}

async function loadLaserModule() {
  // Dynamic import — @laserdata/laser-sdk touches BigInt wire codecs that break Next build collection.
  return import("@laserdata/laser-sdk");
}

export async function laserStatus(): Promise<SponsorStatus> {
  const configured = sponsorEnv.laserdata.configured();
  const now = new Date().toISOString();
  let sdkLoaded = false;
  try {
    await loadLaserModule();
    sdkLoaded = true;
  } catch (err) {
    return {
      id: "laserdata",
      name: "LaserData",
      package: "@laserdata/laser-sdk",
      role: "Durable event streams for Motion + watchdog hits (Apache Iggy)",
      sdkLoaded: false,
      envVars: ["LASER_URI", "LASER_STREAM", "LASER_LOCAL"],
      lastCheckedAt: now,
      configured,
      state: "not_configured",
      live: false,
      detail: "Failed to load @laserdata/laser-sdk.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }

  const base = {
    id: "laserdata" as const,
    name: "LaserData",
    package: "@laserdata/laser-sdk",
    role: "Durable event streams for Motion + watchdog hits (Apache Iggy)",
    sdkLoaded,
    envVars: ["LASER_URI", "LASER_STREAM", "LASER_LOCAL"],
    lastCheckedAt: now,
    configured,
  };

  if (!configured) {
    return {
      ...base,
      state: "not_configured",
      live: false,
      detail:
        "SDK loaded. Events also append to data/laser-events.jsonl. Set LASER_URI or LASER_LOCAL=1 for Iggy/Laser.",
    };
  }

  try {
    const laser = await getLaser();
    await laser.capabilities().catch(() => null);
    return {
      ...base,
      state: "live",
      live: true,
      detail: `Laser SDK connected (stream=${sponsorEnv.laserdata.stream()}).`,
    };
  } catch (err) {
    return {
      ...base,
      state: "configured_unreachable",
      live: false,
      detail: "Connection configured but Laser/Iggy probe failed; JSONL fallback active.",
      lastError: err instanceof Error ? err.message : String(err),
    };
  }
}

async function getLaser(): Promise<LaserClient> {
  if (cached) return cached;
  const mod = await loadLaserModule();
  const Laser = mod.Laser;
  if (sponsorEnv.laserdata.preferLocal()) {
    cached = (await Laser.local()) as unknown as LaserClient;
    return cached;
  }
  const conn = sponsorEnv.laserdata.connection();
  if (!conn) throw new Error("LASER_URI not set");
  cached = (await Laser.connectWithStream(
    conn,
    sponsorEnv.laserdata.stream(),
  )) as unknown as LaserClient;
  return cached;
}

/** Publish a Continuum Motion/watchdog event to LaserData when live; always mirrors to JSONL. */
export async function publishLaserEvent(event: {
  type: string;
  workspaceId: string;
  runId?: string;
  loopId?: string;
  payload?: Record<string, unknown>;
}): Promise<{ published: boolean; transport: "laser" | "jsonl"; error?: string }> {
  const record = {
    ...event,
    ts: new Date().toISOString(),
    source: "continuum",
  };
  await appendLocal(record);

  if (!sponsorEnv.laserdata.configured()) {
    return { published: false, transport: "jsonl" };
  }

  try {
    const laser = await getLaser();
    const topic = laser.stream(sponsorEnv.laserdata.stream()).topic("continuum.events");
    await topic.ensure(1);
    await topic.publish().json(record).send();
    return { published: true, transport: "laser" };
  } catch (err) {
    return {
      published: false,
      transport: "jsonl",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

import { promises as fs } from "fs";
import path from "path";
import { sponsorEnv } from "./env";
import type { SponsorStatus } from "./types";

const GUILD_RUNS = path.join(process.cwd(), ".guild", "continuum-runs");

/**
 * Guild.ai — hackathon partner for experiment tracking / agent observability.
 * Classic Guild is Python-first; Guild Agents use @guildai/cli + agents-sdk in their runtime.
 * Continuum records Motion runs as Guild-style experiment JSON and keeps a Guild agent stub
 * under guild/continuum-motion/ for `guild agent test` when the CLI is available.
 */
export async function guildStatus(): Promise<SponsorStatus> {
  const configured = sponsorEnv.guild.configured();
  const now = new Date().toISOString();
  let cliPresent = false;
  try {
    // Optional peer — present when installed as a dep/devDep
    await import("@guildai/cli/package.json", { with: { type: "json" } });
    cliPresent = true;
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require.resolve("@guildai/cli/package.json");
      cliPresent = true;
    } catch {
      cliPresent = false;
    }
  }

  return {
    id: "guild",
    name: "Guild.ai",
    package: "@guildai/cli",
    role: "Experiment / agent run tracking for Motion executions",
    // Writer path always available; CLI optional for `guild agent test`
    sdkLoaded: true,
    envVars: ["GUILD_API_KEY", "GUILD_WORKSPACE", "GUILD_HOME"],
    lastCheckedAt: now,
    configured,
    state: configured ? "configured_unreachable" : "demo_fallback",
    live: false,
    detail: configured
      ? "Guild token present — Continuum writes local Guild-format run records; cloud sync depends on Guild workspace access."
      : cliPresent
        ? "Guild experiment writer active (.guild/continuum-runs/). CLI available for guild/continuum-motion agent tests."
        : "Guild experiment writer active (.guild/continuum-runs/). Install @guildai/cli for agent runtime tests.",
  };
}

export async function recordGuildExperiment(input: {
  runId: string;
  loopId: string;
  title: string;
  status: string;
  debtBefore?: number;
  debtAfter?: number;
  dollarsFreed?: number;
  mode: string;
  providerFlags: Record<string, boolean>;
}): Promise<{ recorded: boolean; path: string }> {
  await fs.mkdir(GUILD_RUNS, { recursive: true });
  const file = path.join(GUILD_RUNS, `${input.runId}.json`);
  const doc = {
    guild_format: "continuum.v1",
    operation: "continuum.close_open_loop",
    started: new Date().toISOString(),
    flags: {
      mode: input.mode,
      ...input.providerFlags,
    },
    attrs: {
      runId: input.runId,
      loopId: input.loopId,
      title: input.title,
      status: input.status,
      debtBefore: input.debtBefore ?? null,
      debtAfter: input.debtAfter ?? null,
      dollarsFreed: input.dollarsFreed ?? null,
    },
    scalars: {
      debt_before: input.debtBefore ?? 0,
      debt_after: input.debtAfter ?? 0,
      dollars_freed: input.dollarsFreed ?? 0,
    },
    label: `${input.status}:${input.runId}`,
  };
  await fs.writeFile(file, JSON.stringify(doc, null, 2));
  return { recorded: true, path: file };
}

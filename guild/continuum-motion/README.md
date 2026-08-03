/**
 * Guild.ai agent stub for Continuum Motion observability.
 *
 * This file is intended for the Guild agent runtime (`@guildai/agents-sdk`),
 * which provides `defineAgent` / `task` only inside `guild agent test|deploy`.
 * Continuum also logs Guild-format experiments to `.guild/continuum-runs/` from
 * the Next.js Motion worker via `recordGuildExperiment`.
 *
 * To use with Guild CLI (when authenticated):
 *   npx guild agent test
 *
 * Do not import this module from the Next.js app — Guild sandboxes disallow
 * arbitrary Node builtins / npm packages.
 */

export const CONTINUUM_GUILD_AGENT = {
  name: "continuum-motion-tracker",
  description:
    "Tracks Continuum Open Loop Debt Motions as Guild experiments: debt_before, debt_after, dollars_freed, sponsor flags.",
  inputs: {
    runId: "string",
    loopId: "string",
    status: "string",
  },
  metrics: ["debt_before", "debt_after", "dollars_freed"],
};

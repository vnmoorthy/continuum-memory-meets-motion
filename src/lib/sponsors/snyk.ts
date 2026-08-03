import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { sponsorEnv } from "./env";
import type { SponsorStatus } from "./types";

const execFileAsync = promisify(execFile);
const SNYK_REPORT = path.join(process.cwd(), "data", "snyk-last-scan.json");

export async function snykStatus(): Promise<SponsorStatus> {
  const configured = sponsorEnv.snyk.configured();
  const now = new Date().toISOString();
  let sdkLoaded = false;
  try {
    require.resolve("snyk/package.json");
    sdkLoaded = true;
  } catch {
    sdkLoaded = false;
  }

  let lastScan: { ok?: boolean; uniqueCount?: number; at?: string; error?: string } | null = null;
  try {
    lastScan = JSON.parse(await fs.readFile(SNYK_REPORT, "utf8")) as {
      ok?: boolean;
      uniqueCount?: number;
      at?: string;
      error?: string;
    };
  } catch {
    lastScan = null;
  }

  return {
    id: "snyk",
    name: "Snyk",
    package: "snyk",
    role: "Dependency & security scanning for Continuum releases",
    sdkLoaded,
    envVars: ["SNYK_TOKEN", "SNYK_ORG_ID"],
    lastCheckedAt: now,
    configured,
    live: Boolean(lastScan?.ok && configured),
    state: lastScan?.ok
      ? configured
        ? "live"
        : "demo_fallback"
      : configured
        ? "configured_unreachable"
        : "not_configured",
    detail: lastScan
      ? `Last scan ${lastScan.at ?? "unknown"} — unique issues: ${lastScan.uniqueCount ?? "?"}. Run npm run snyk:test.`
      : "SDK installed. Run npm run snyk:test (auth via SNYK_TOKEN or snyk auth).",
  };
}

/** Run Snyk test via the installed `snyk` package CLI and persist a summary. */
export async function runSnykScan(): Promise<{
  ok: boolean;
  uniqueCount: number;
  reportPath: string;
  rawExitCode: number | null;
  error?: string;
}> {
  const snykBin = path.join(process.cwd(), "node_modules", "snyk", "bin", "snyk");
  const env = { ...process.env };
  if (sponsorEnv.snyk.token()) env.SNYK_TOKEN = sponsorEnv.snyk.token()!;

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [snykBin, "test", "--json", "--severity=true"],
      {
        cwd: process.cwd(),
        env,
        maxBuffer: 20 * 1024 * 1024,
        timeout: 120_000,
      },
    );
    const parsed = JSON.parse(stdout) as { uniqueCount?: number; vulnerabilities?: unknown[] };
    const summary = {
      ok: true,
      uniqueCount: parsed.uniqueCount ?? parsed.vulnerabilities?.length ?? 0,
      at: new Date().toISOString(),
      provider: "snyk",
    };
    await fs.mkdir(path.dirname(SNYK_REPORT), { recursive: true });
    await fs.writeFile(SNYK_REPORT, JSON.stringify(summary, null, 2));
    return { ok: true, uniqueCount: summary.uniqueCount, reportPath: SNYK_REPORT, rawExitCode: 0 };
  } catch (err) {
    const e = err as { stdout?: string; code?: number; message?: string };
    // snyk exits non-zero when vulns found — still parse JSON if present
    if (e.stdout) {
      try {
        const parsed = JSON.parse(e.stdout) as { uniqueCount?: number; vulnerabilities?: unknown[] };
        const summary = {
          ok: true,
          uniqueCount: parsed.uniqueCount ?? parsed.vulnerabilities?.length ?? 0,
          at: new Date().toISOString(),
          provider: "snyk",
          exitCode: e.code ?? null,
        };
        await fs.mkdir(path.dirname(SNYK_REPORT), { recursive: true });
        await fs.writeFile(SNYK_REPORT, JSON.stringify(summary, null, 2));
        return {
          ok: true,
          uniqueCount: summary.uniqueCount,
          reportPath: SNYK_REPORT,
          rawExitCode: e.code ?? null,
        };
      } catch {
        /* fall through */
      }
    }
    const summary = {
      ok: false,
      uniqueCount: -1,
      at: new Date().toISOString(),
      error: e.message ?? String(err),
    };
    await fs.mkdir(path.dirname(SNYK_REPORT), { recursive: true });
    await fs.writeFile(SNYK_REPORT, JSON.stringify(summary, null, 2));
    return {
      ok: false,
      uniqueCount: -1,
      reportPath: SNYK_REPORT,
      rawExitCode: e.code ?? null,
      error: summary.error,
    };
  }
}

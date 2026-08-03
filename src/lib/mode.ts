export type ContinuumMode = "demo" | "connected";

/** Default is demo — simulated Motion/research/notify unless credentials + CONTINUUM_MODE=connected. */
export function getContinuumMode(): ContinuumMode {
  const raw = (process.env.CONTINUUM_MODE ?? process.env.DEMO_MODE ?? "demo")
    .toString()
    .trim()
    .toLowerCase();
  if (raw === "connected" || raw === "live" || raw === "false" || raw === "0") {
    // connected only when explicitly requested AND not forced demo
    if (raw === "connected" || raw === "live") return "connected";
  }
  if (raw === "demo" || raw === "true" || raw === "1" || raw === "") return "demo";
  return "demo";
}

export function isDemoMode(): boolean {
  return getContinuumMode() === "demo";
}

export const DEMO_LABEL = "DEMO";
export const DEMO_BANNER =
  "DEMO MODE — simulations only. No live connectors, outbound notify, or grounded web claims.";

export function demoPrefix(message: string): string {
  return isDemoMode() ? `[${DEMO_LABEL}] ${message}` : message;
}

export function modePayload(workspaceId?: string) {
  const mode = getContinuumMode();
  return {
    mode,
    demo: mode === "demo",
    label: mode === "demo" ? DEMO_LABEL : "CONNECTED",
    banner: mode === "demo" ? DEMO_BANNER : null,
    ...(workspaceId ? { workspaceId } : {}),
  };
}

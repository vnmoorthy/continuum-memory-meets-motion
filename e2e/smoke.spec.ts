import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.beforeAll(() => {
  fs.mkdirSync(path.join(process.cwd(), ".tmp"), { recursive: true });
});

test("smoke: landing, app shell, metrics, demo banner", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Continuum").first()).toBeVisible();

  await page.goto("/app");
  await expect(page.getByText(/DEMO MODE/i).first()).toBeVisible();
  await expect(page.getByText(/Open Loop|Command|Debt|Memory/i).first()).toBeVisible({
    timeout: 30_000,
  });

  // Establish session cookie before concurrent API calls
  const metrics = await page.request.get("/api/metrics");
  expect(metrics.ok()).toBeTruthy();
  const body = await metrics.json();
  expect(body._meta?.mode ?? body.mode?.mode).toBeTruthy();
  expect(body.dollarsAtRisk).toBe(268000);

  // invalid tags → 422
  const bad = await page.request.post("/api/memory", {
    data: {
      kind: "artifact",
      title: "Bad",
      summary: "x",
      tags: "not-array",
    },
  });
  expect(bad.status()).toBe(422);

  // Reset this workspace so loop-pilot-update is open for concurrency check
  const reset = await page.request.post("/api/memory", { data: { action: "reset" } });
  expect(reset.ok()).toBeTruthy();

  const loopId = "loop-pilot-update";
  const posts = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      page.request.post("/api/runs", {
        data: { loopId, trigger: "manual" },
        headers: { "Idempotency-Key": `e2e-${Date.now()}-${i}` },
      }),
    ),
  );
  const bodies = await Promise.all(posts.map(async (r) => ({ status: r.status(), body: await r.json() })));
  const workspaces = [...new Set(bodies.map((b) => b.body.workspaceId ?? b.body._meta?.workspaceId))];
  const created = bodies.filter((b) => b.status === 201);
  const conflicts = bodies.filter((b) => b.status === 409);
  expect(
    created.length,
    `statuses=${bodies.map((b) => b.status).join(",")} workspaces=${workspaces.join("|")} ids=${created.map((c) => c.body.id).join(",")}`,
  ).toBe(1);
  expect(conflicts.length).toBe(9);
  const runBody = created[0]!.body;
  expect(runBody.id).toBeTruthy();
  const get = await page.request.get(`/api/runs?id=${runBody.id}`);
  expect(get.ok()).toBeTruthy();
});

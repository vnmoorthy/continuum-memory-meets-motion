import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:3456",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx next start -p 3456",
    url: "http://127.0.0.1:3456",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      CONTINUUM_MODE: "demo",
      CONTINUUM_FAST: "1",
      CONTINUUM_DB_PATH: ".tmp/e2e-continuum.sqlite",
      CONTINUUM_SESSION_SECRET: "e2e-test-secret-key-32chars!!",
      CONTINUUM_COOKIE_SECURE: "0",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

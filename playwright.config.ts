import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /**
   * Two workers, not the CPU count: every page here hits Neon over the network,
   * and five parallel workers push a cold serverless Postgres into 30s+
   * responses that look like navigation timeouts.
   */
  workers: 2,
  reporter: process.env.CI ? "github" : "list",

  /**
   * Generous timeouts on purpose: this suite runs against `next dev`, and a
   * cold Turbopack compile of a route can take 10s+ on first hit. The default
   * 5s expect timeout turns that into a flaky failure that looks like a bug.
   */
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    navigationTimeout: 30_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

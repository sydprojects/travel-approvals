import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3099;
const API_PORT = 4099;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node ../api/src/server.js",
      url: `http://localhost:${API_PORT}/health`,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
      env: { PORT: String(API_PORT), ALLOWED_ORIGIN: `http://localhost:${WEB_PORT}` },
    },
    {
      command: `npx next dev -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: { PLATFORM_API_URL: `http://localhost:${API_PORT}`, PORT: String(WEB_PORT) },
    },
  ],
});

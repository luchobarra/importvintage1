import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const testEnv = loadEnvFile(".env.test.local");
const baseURL =
  process.env.E2E_BASE_URL ?? testEnv.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const serverUrl = new URL(baseURL);
const serverPort =
  serverUrl.port || (serverUrl.protocol === "https:" ? "443" : "80");
const serverHost = serverUrl.hostname;
const webServerEnv: Record<string, string> = {
  ...getDefinedEnv(process.env),
  ...testEnv,
  NEXT_PUBLIC_ENABLE_ADMIN_SESSION_TIMEOUT_OVERRIDE:
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_SESSION_TIMEOUT_OVERRIDE ??
    testEnv.NEXT_PUBLIC_ENABLE_ADMIN_SESSION_TIMEOUT_OVERRIDE ??
    "true",
};
const runsAdminFlows = webServerEnv.E2E_RUN_ADMIN_FLOWS === "true";

validateE2EEnv(webServerEnv);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI || runsAdminFlows ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -H ${serverHost} -p ${serverPort}`,
    env: webServerEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});

function validateE2EEnv(env: Record<string, string>) {
  if (env.E2E_RUN_ADMIN_FLOWS !== "true") {
    return;
  }

  const missingKeys = ["E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD"].filter(
    (key) => !env[key],
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Faltan variables para E2E admin completo: ${missingKeys.join(", ")}. Configuralas en .env.test.local.`,
    );
  }
}

function getDefinedEnv(env: NodeJS.ProcessEnv) {
  const definedEnv: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      definedEnv[key] = value;
    }
  }

  return definedEnv;
}

function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);
  const env: Record<string, string> = {};

  if (!existsSync(filePath)) {
    return env;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    env[key] = value;
    process.env[key] ??= value;
  }

  return env;
}

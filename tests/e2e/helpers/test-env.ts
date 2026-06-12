import { test } from "@playwright/test";

export function requireAdminE2E() {
  const shouldRunAdminFlows = process.env.E2E_RUN_ADMIN_FLOWS === "true";
  const hasCredentials = Boolean(
    process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD,
  );

  test.skip(
    !shouldRunAdminFlows,
    "Admin E2E flows require E2E_RUN_ADMIN_FLOWS=true.",
  );

  if (!hasCredentials) {
    throw new Error(
      "Falta configurar E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD en .env.test.local.",
    );
  }
}

export function getAdminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL ?? "",
    password: process.env.E2E_ADMIN_PASSWORD ?? "",
  };
}

import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";
import { requireAdminE2E } from "./helpers/test-env";

test.describe("admin session timeout", () => {
  test.beforeEach(() => {
    requireAdminE2E();
  });

  test("expires the admin session after inactivity", async ({ page }) => {
    await page.goto("/admin/login");
    await page.evaluate(() => {
      window.localStorage.setItem("admin-session-timeout-ms", "2000");
    });

    await loginAsAdmin(page);

    await page.waitForURL(/\/admin\/login\?reason=session-expired$/, {
      timeout: 10_000,
    });
    await expect(
      page.getByText("Sesion vencida por inactividad."),
    ).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";
import { requireAdminE2E } from "./helpers/test-env";

test.describe("admin authentication", () => {
  test.beforeEach(() => {
    requireAdminE2E();
  });

  test("allows the configured test admin to access the private panel", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(
      page.getByRole("heading", { name: /admin|panel/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /productos/i })).toBeVisible();
  });
});

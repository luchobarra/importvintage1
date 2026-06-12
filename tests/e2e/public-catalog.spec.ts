import { expect, test } from "@playwright/test";

test.describe("public catalog", () => {
  test("loads the catalog and exposes admin entry point", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Prendas disponibles" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin/login",
    );
  });
});

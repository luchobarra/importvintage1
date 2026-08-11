import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";
import { requireAdminE2E } from "./helpers/test-env";

test.describe("admin products", () => {
  test.beforeEach(async ({ page }) => {
    requireAdminE2E();
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "Productos" }).click();
    await expect(page).toHaveURL(/\/retro-campus-admin\/productos$/);
  });

  test("shows product search controls and the new product entry point", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Productos" }),
    ).toBeVisible();
    await expect(page.getByLabel("Titulo")).toBeVisible();
    await expect(page.getByLabel("Marca")).toBeVisible();
    await expect(page.getByLabel("Categoria")).toBeVisible();
    await expect(page.getByLabel("Talle")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buscar" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Nuevo producto" }),
    ).toBeVisible();
  });

  test("validates short title searches", async ({ page }) => {
    await page.getByLabel("Titulo").fill("ca");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText("Ingresá al menos 3 caracteres.")).toBeVisible();
    await expect(page.locator(".product-search").getByRole("alert")).toContainText(
      "Ingresá al menos 3 caracteres.",
    );
  });
});

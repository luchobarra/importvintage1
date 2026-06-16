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

  test("loads public filters from query params", async ({ page }) => {
    await page.goto(
      "/?category=buzos&size=l&sort=price_desc",
    );

    await expect(page.getByLabel("Marca")).toHaveValue("");
    await expect(page.getByLabel("Categoria")).toHaveValue("buzos");
    await expect(page.getByLabel("Talle")).toHaveValue("L");
    await expect(page.getByLabel("Ordenar")).toHaveValue("price_desc");
    await expect(
      page.getByRole("button", { name: "Aplicar filtros" }),
    ).toBeVisible();
    await expect(
      page.locator("form").getByRole("link", { name: "Limpiar filtros" }),
    ).toHaveAttribute("href", "/");
  });

  test("shows a controlled error when a product detail cannot load", async ({
    page,
  }) => {
    await page.goto("/productos/producto-inexistente");

    await expect(
      page.getByRole("heading", { name: "Algo salio mal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Volver al catalogo" }),
    ).toHaveAttribute("href", "/");
  });
});

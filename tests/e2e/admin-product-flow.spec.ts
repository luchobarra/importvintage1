import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";
import {
  createProductFromAdmin,
  createTestProductData,
  confirmDialog,
  deleteProductFromList,
  fillProductForm,
  openProductEditorFromList,
  searchProductByTitle,
  uploadTestImage,
} from "./helpers/product-fixtures";
import { requireAdminE2E } from "./helpers/test-env";

test.describe("admin product flow", () => {
  test.beforeEach(async ({ page }) => {
    requireAdminE2E();
    await loginAsAdmin(page);
  });

  test("creates, searches, edits and deletes a product", async ({ page }) => {
    const product = createTestProductData();
    const editedTitle = `${product.title} editado`;

    try {
      await createProductFromAdmin(page, product);
      await searchProductByTitle(page, product.title);
      await openProductEditorFromList(page, product.title);

      await page.getByLabel("Titulo *").fill(editedTitle);
      await page.getByLabel("Talle *").fill("m");
      await expect(page.getByLabel("Talle *")).toHaveValue("M");

      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await confirmDialog(page, "Guardar cambios");
      await expect(
        page.getByRole("heading", { name: "Producto actualizado" }),
      ).toBeVisible({
        timeout: 30_000,
      });
      await page.getByRole("button", { name: "Entendido" }).click();
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(
        () => {},
      );

      await searchProductByTitle(page, editedTitle);
      await deleteProductFromList(page, editedTitle);
    } catch (error) {
      await cleanupProduct(page, editedTitle);
      await cleanupProduct(page, product.title);
      throw error;
    }
  });

  test("requires at least one image to create a product", async ({ page }) => {
    const product = createTestProductData();

    await page.goto("/admin/productos/nuevo");
    await fillProductForm(page, product);
    await page.getByRole("button", { name: "Cargar producto" }).click();

    await expect(page.getByText("Carga al menos 1 imagen.")).toBeVisible();
  });

  test("allows removing a selected image before submitting", async ({ page }) => {
    const product = createTestProductData();

    await page.goto("/admin/productos/nuevo");
    await fillProductForm(page, product);
    await uploadTestImage(page);

    await expect(page.getByAltText("Vista previa 1")).toBeVisible();
    await page.getByRole("button", { name: "Quitar" }).click();
    await expect(page.getByAltText("Vista previa 1")).toHaveCount(0);
  });
});

async function cleanupProduct(page: import("@playwright/test").Page, title: string) {
  try {
    await deleteProductFromList(page, title);
  } catch {
    // Best-effort cleanup. The original test failure is more useful.
  }
}

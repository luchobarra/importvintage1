import { expect, test } from "@playwright/test";
import { confirmDialog, deleteProductFromList, openProductEditorFromList, searchProductByTitle, uploadTestImage } from "./helpers/product-fixtures";
import { loginAsAdmin } from "./helpers/admin-auth";
import { requireAdminE2E } from "./helpers/test-env";

test.describe("admin catalog options", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    requireAdminE2E();
    await loginAsAdmin(page);
    await page.goto("/admin/catalogo");
    await expect(page).toHaveURL(/\/admin\/catalogo$/);
  });

  test("manages categories, brands, sizes and their product/home impact", async ({
    page,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const categoryName = `QA Categoria ${suffix}`;
    const brandName = `QA Marca ${suffix}`;
    const letterSizeOne = `QA${suffix.slice(-4)}A`.toUpperCase();
    const letterSizeTwo = `QA${suffix.slice(-4)}B`.toUpperCase();
    const numericSize = `${900 + (Date.now() % 90)}`;
    const productTitle = `QA Producto ${suffix}`;
    const editedProductTitle = `${productTitle} editado`;

    const categorySection = page
      .locator(".catalog-options-section")
      .filter({ has: page.getByRole("button", { name: /^Categorias/ }) });
    const brandSection = page
      .locator(".catalog-options-section")
      .filter({ has: page.getByRole("button", { name: /^Marcas/ }) });
    const sizeSection = page
      .locator(".catalog-options-section")
      .filter({ has: page.getByRole("button", { name: /^Talles/ }) });

    await test.step("category form starts with no size group selected", async () => {
      await page.getByRole("button", { name: /^Categorias/ }).click();
      const createForm = categorySection.locator(".catalog-category-form");

      await expect(createForm.locator("input[type='checkbox']:checked")).toHaveCount(0);
      await createForm.getByRole("button", { name: "Agregar" }).click();
      await expect(page.getByRole("dialog")).toContainText("Crear categoria");
      await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    await test.step("creates a category, brand and size options", async () => {
      const createCategoryForm = categorySection.locator(".catalog-category-form");
      await createCategoryForm.getByLabel("Letras").check();
      await createCategoryForm.getByLabel("Numericos").check();
      await createCategoryForm.getByLabel("Nueva categoria").fill(categoryName);
      await createCategoryForm.getByRole("button", { name: "Agregar" }).click();
      await confirmDialog(page, "Crear categoria");
      await expect(
        page.getByRole("heading", { name: "Categoria creada" }),
      ).toBeVisible();
      await closeResultModal(page);

      await page.getByRole("button", { name: /^Marcas/ }).click();
      const createBrandForm = brandSection.locator(".catalog-option-create");
      await createBrandForm.getByLabel("Nueva opcion").fill(brandName);
      await createBrandForm.getByRole("button", { name: "Agregar" }).click();
      await confirmDialog(page, "Crear marca");
      await expect(
        page.getByRole("heading", { name: "Marca creada" }),
      ).toBeVisible();
      await closeResultModal(page);

      await page.getByRole("button", { name: /^Talles/ }).click();
      await sizeSection.getByRole("button", { name: "Letras" }).click();
      const letterForm = sizeSection.locator(".catalog-size-create");
      await letterForm.getByLabel("Nuevo talle").fill(letterSizeOne);
      await letterForm.getByRole("button", { name: "Agregar" }).click();
      await confirmDialog(page, "Agregar talle");
      await closeResultModal(page);

      await letterForm.getByLabel("Nuevo talle").fill(letterSizeTwo);
      await letterForm.getByRole("button", { name: "Agregar" }).click();
      await confirmDialog(page, "Agregar talle");
      await closeResultModal(page);
      await expect(page.getByText(`Talle: ${letterSizeTwo}`)).toBeVisible();

      await sizeSection.getByRole("button", { name: "Numericos" }).click();
      const numericForm = sizeSection.locator(".catalog-size-create");
      await numericForm.getByLabel("Nuevo talle").fill(numericSize);
      await numericForm.getByRole("button", { name: "Agregar" }).click();
      await confirmDialog(page, "Agregar talle");
      await closeResultModal(page);
      await expect(page.getByText(`Talle: ${numericSize}`)).toBeVisible();
    });

    await test.step("reflects catalog options in the product form", async () => {
      await page.goto("/admin/productos/nuevo");
      await expect(page).toHaveURL(/\/admin\/productos\/nuevo$/);

      await page.getByLabel("Titulo *").fill(productTitle);
      await page.getByLabel("Marca *").selectOption({ label: brandName });
      await page.getByLabel("Categoria *").selectOption({ label: categoryName });

      const sizeSelect = page.getByLabel("Talle *");
      await expect(page.getByRole("option", { name: letterSizeOne })).toHaveCount(1);
      await expect(page.getByRole("option", { name: numericSize })).toHaveCount(1);

      const letterSizeOptionValue = await page
        .getByRole("option", { name: letterSizeOne })
        .getAttribute("value");
      if (!letterSizeOptionValue) {
        throw new Error(`No se pudo leer el value de ${letterSizeOne}.`);
      }

      await sizeSelect.selectOption(letterSizeOptionValue);
      await page.getByLabel("Precio en pesos *").fill("25000");
      await page.getByLabel("Descripcion / estado *").fill("Prenda QA");
      await uploadTestImage(page);

      await page.getByRole("button", { name: "Cargar producto" }).click();
      await confirmDialog(page, "Cargar producto");
      await expect(
        page.getByRole("heading", { name: "Producto cargado" }),
      ).toBeVisible({
        timeout: 60_000,
      });
      await page.getByRole("button", { name: "Entendido" }).click();

      await searchProductByTitle(page, productTitle);
      await openProductEditorFromList(page, productTitle);
      await page.getByLabel("Titulo *").fill(editedProductTitle);
      await expect(
        page.getByLabel("Talle *").locator("option:checked"),
      ).toHaveText(letterSizeOne);
      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await confirmDialog(page, "Guardar cambios");
      await expect(
        page.getByRole("heading", { name: "Producto actualizado" }),
      ).toBeVisible({
        timeout: 30_000,
      });
      await page.getByRole("button", { name: "Entendido" }).click();

      await searchProductByTitle(page, editedProductTitle);
      await deleteProductFromList(page, editedProductTitle);
    });

    await test.step("edits category flags and a size label", async () => {
      await page.goto("/admin/catalogo");
      await expect(page).toHaveURL(/\/admin\/catalogo$/);
      await page.getByRole("button", { name: /^Categorias/ }).click();
      const createdCategory = categorySection.locator(".catalog-category-card").filter({
        has: page.getByRole("button", { name: `Mover categoria ${categoryName}` }),
      });
      await createdCategory.getByRole("button", { name: "Editar" }).click();
      await createdCategory.getByLabel("Letras").uncheck();
      await createdCategory.getByLabel("Numericos").check();
      await createdCategory.getByRole("button", { name: "Guardar" }).click();
      await confirmDialog(page, "Guardar categoria");
      await expect(
        page.getByRole("heading", { name: "Categoria guardada" }),
      ).toBeVisible();

      await page.getByRole("button", { name: /^Talles/ }).click();
      await sizeSection.getByRole("button", { name: "Letras" }).click();
      const firstLetterCard = sizeSection.locator(".catalog-size-card").filter({
        has: page.getByRole("button", { name: `Mover talle ${letterSizeOne}` }),
      });
      await firstLetterCard.getByRole("button", { name: "Editar" }).click();
      await firstLetterCard.locator("input[name='name']").fill(
        `${letterSizeOne}-EDIT`,
      );
      await firstLetterCard.getByRole("button", { name: "Guardar" }).click();
      await confirmDialog(page, "Guardar talle");
      await expect(
        page.getByRole("heading", { name: "Talle guardado" }),
      ).toBeVisible();
    });

    await test.step("exposes the created catalog options in the public home", async () => {
      await page.goto("/");
      await expect(page.getByLabel("Marca")).toContainText(brandName);
      await expect(page.getByLabel("Categoria")).toContainText(categoryName);

      await page.getByLabel("Categoria").selectOption({ label: categoryName });
      await expect(page.getByLabel("Talle")).toContainText(numericSize);
      await expect(page.getByLabel("Talle")).not.toContainText(`${letterSizeOne}-EDIT`);
    });
  });
});

async function closeResultModal(page: import("@playwright/test").Page) {
  const button = page.getByRole("button", { name: "Entendido" });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      return;
    }

    await page.waitForTimeout(250);
  }
}

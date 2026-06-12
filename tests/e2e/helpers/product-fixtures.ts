import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

type TestProductInput = {
  title: string;
  brand: string;
  category?: string;
  size?: string;
  price?: string;
  description?: string;
};

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

export function createTestProductData() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const prefix = process.env.E2E_TEST_PRODUCT_PREFIX ?? "TEST-E2E";

  return {
    title: `${prefix} Producto ${suffix}`,
    brand: `${prefix} Marca`,
    category: "buzos",
    size: "xl",
    price: "12345",
    description: `Producto generado por E2E ${suffix}`,
  };
}

export async function fillProductForm(page: Page, product: TestProductInput) {
  await page.getByLabel("Titulo *").fill(product.title);
  await page.getByLabel("Marca *").fill(product.brand);
  await page.getByLabel("Categoria *").selectOption(product.category ?? "buzos");
  await page.getByLabel("Talle *").fill(product.size ?? "xl");
  await expect(page.getByLabel("Talle *")).toHaveValue(
    (product.size ?? "xl").toUpperCase(),
  );
  await page.getByLabel("Precio en pesos *").fill(product.price ?? "12345");
  await page
    .getByLabel("Descripcion / estado")
    .fill(product.description ?? "Producto generado por E2E");
}

export async function uploadTestImage(page: Page, fileName = "product.png") {
  const fileInput = page.locator("input[type='file']");

  await fileInput.setInputFiles({
    buffer: Buffer.from(pngBase64, "base64"),
    mimeType: "image/png",
    name: fileName,
  });
}

export async function createProductFromAdmin(page: Page, product: TestProductInput) {
  await page.goto("/admin/productos/nuevo");
  await fillProductForm(page, product);
  await uploadTestImage(page);
  await expect(page.getByAltText("Vista previa 1")).toBeVisible();

  await page.getByRole("button", { name: "Cargar producto" }).click();
  await confirmDialog(page, "Cargar producto");

  await expect(
    page.getByRole("heading", { name: "Producto cargado" }),
  ).toBeVisible({
    timeout: 60_000,
  });
}

export async function searchProductByTitle(page: Page, title: string) {
  await waitForSettledPage(page);
  await gotoWithRetry(page, "/admin/productos");
  await page.getByLabel("Titulo").fill(title);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

export async function openProductEditorFromList(page: Page, title: string) {
  const productItem = page
    .locator(".admin-product-item")
    .filter({ has: page.getByRole("heading", { name: title }) });

  await productItem.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/admin\/productos\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Editar producto" })).toBeVisible();
}

export async function deleteProductFromList(page: Page, title: string) {
  await searchProductByTitle(page, title);

  const productItem = page
    .locator(".admin-product-item")
    .filter({ has: page.getByRole("heading", { name: title }) });

  await productItem.getByRole("button", { name: "Eliminar" }).click();
  await confirmDialog(page, "Eliminar producto");
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0, {
    timeout: 30_000,
  });
}

export async function confirmDialog(page: Page, buttonName: string) {
  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: buttonName }).click();
}

async function waitForSettledPage(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 5_000 });
  } catch {
    await page.waitForLoadState("domcontentloaded", { timeout: 5_000 }).catch(
      () => {},
    );
  }
}

async function gotoWithRetry(page: Page, url: string) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const canRetry =
        attempt < 2 &&
        (message.includes("NS_BINDING_ABORTED") ||
          message.includes("interrupted by another navigation"));

      if (!canRetry) {
        throw error;
      }

      await page.waitForTimeout(500);
    }
  }
}

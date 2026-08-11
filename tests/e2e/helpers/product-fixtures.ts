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
    category: "Buzos",
    size: "XL",
    price: "12345",
    description: `Producto generado por E2E ${suffix}`,
  };
}

export async function fillProductForm(page: Page, product: TestProductInput) {
  await page.getByLabel("Titulo *").fill(product.title);

  const brandSelect = page.getByLabel("Marca *");
  await selectOptionByTextOrFallback(brandSelect, product.brand);

  const categorySelect = page.getByLabel("Categoria *");
  await selectOptionByTextOrFallback(categorySelect, product.category);

  const sizeSelect = page.getByLabel("Talle *");
  await expect(sizeSelect).not.toBeDisabled();
  await selectOptionByTextOrFallback(sizeSelect, product.size);
  await expect(sizeSelect).not.toHaveValue("");

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
  await page.goto("/retro-campus-admin/productos/nuevo");
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
  await gotoWithRetry(page, "/retro-campus-admin/productos");
  await page.getByLabel("Titulo").fill(title);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

export async function openProductEditorFromList(page: Page, title: string) {
  const productItem = page
    .locator(".admin-product-item")
    .filter({ has: page.getByRole("heading", { name: title }) });

  await productItem.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/retro-campus-admin\/productos\/[^/]+$/);
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

async function selectOptionByTextOrFallback(
  select: ReturnType<Page["getByLabel"]>,
  desiredValue?: string,
) {
  const normalizedDesiredValue = desiredValue?.trim().toLowerCase();
  const optionEntries = await select
    .locator("option")
    .evaluateAll((options) =>
      options
        .map((option) => ({
          label: option.textContent?.trim() ?? "",
          value: option.getAttribute("value") ?? "",
        }))
        .filter(
          (option) =>
            option.label.length > 0 && option.value.trim().length > 0,
        ),
    );

  const matchingOption = normalizedDesiredValue
    ? optionEntries.find(
        (optionText) => optionText.label.trim().toLowerCase() === normalizedDesiredValue,
      )
    : undefined;

  if (matchingOption) {
    await select.selectOption({ label: matchingOption.label });
    return;
  }

  const fallbackOption = optionEntries[0];
  if (!fallbackOption) {
    throw new Error("No hay opciones disponibles para seleccionar.");
  }

  await select.selectOption({ label: fallbackOption.label });
}

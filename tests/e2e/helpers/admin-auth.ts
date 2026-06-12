import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { getAdminCredentials } from "./test-env";

export async function loginAsAdmin(page: Page) {
  const { email, password } = getAdminCredentials();

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

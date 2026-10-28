import { test, expect } from "@playwright/test";

test("carga la app y muestra onboarding o mapa", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/Parcháte Bogotá|Mapa|Inicia sesión/);
});
